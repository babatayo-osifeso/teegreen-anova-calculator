// ============================================================
// STUDENTIZED RANGE DISTRIBUTION
// Used by Tukey HSD / Tukey-Kramer
// ============================================================

function studentizedRangeCDF(q, k, df) {

    if (!Number.isFinite(q) || q <= 0) {
        return 0;
    }

    if (!Number.isInteger(k) || k < 2) {
        throw new Error("Studentized range requires k >= 2.");
    }

    if (!Number.isFinite(df) || df <= 0) {
        throw new Error("Degrees of freedom must be > 0.");
    }


    // --------------------------------------------------------
    // Special case k = 2
    //
    // Studentized range with k=2:
    // q = sqrt(2) * |t|
    // --------------------------------------------------------

    if (k === 2) {

        let t =
            q / Math.sqrt(2);

        return (
            2 *
            jStat.studentt.cdf(
                t,
                df
            )
        ) - 1;

    }


    // --------------------------------------------------------
    // Standard normal PDF
    // --------------------------------------------------------

    function normalPDF(x) {

        return Math.exp(
            -0.5 * x * x
        ) / Math.sqrt(
            2 * Math.PI
        );

    }


    // --------------------------------------------------------
    // Standard normal CDF
    // --------------------------------------------------------

    function normalCDF(x) {

        return jStat.normal.cdf(
            x,
            0,
            1
        );

    }


    // --------------------------------------------------------
    // Inner integral
    //
    // Integral:
    //
    // k ∫ φ(z)
    // [ Φ(z + q*s) - Φ(z) ]^(k-1) dz
    //
    // --------------------------------------------------------

    function innerIntegral(s) {

        const lower = -8;
        const upper = 8;

        const steps = 80;

        const h =
            (upper - lower) /
            steps;

        let sum = 0;


        for (
            let i = 0;
            i <= steps;
            i++
        ) {

            const z =
                lower + i * h;


            const probability =
                normalCDF(
                    z + q * s
                ) -
                normalCDF(z);


            const value =
                k *
                normalPDF(z) *
                Math.pow(
                    Math.max(
                        0,
                        probability
                    ),
                    k - 1
                );


            let weight = 1;

            if (
                i !== 0 &&
                i !== steps
            ) {

                weight =
                    i % 2 === 0
                        ? 2
                        : 4;

            }


            sum +=
                weight * value;

        }


        return (
            sum * h / 3
        );

    }


    // --------------------------------------------------------
    // Chi-distribution density
    //
    // s is the random scale factor.
    //
    // f(s) =
    // [df^(df/2) / (2^(df/2-1) Γ(df/2))]
    // s^(df-1) exp(-df*s²/2)
    //
    // --------------------------------------------------------

    function chiDensity(s) {

        if (s <= 0) {
            return 0;
        }


        const half =
            df / 2;


        const logConstant =
            half * Math.log(df)
            -
            (half - 1) *
            Math.log(2)
            -
            jStat.gammaln(half);


        const logDensity =
            logConstant
            +
            (df - 1) *
            Math.log(s)
            -
            (df * s * s / 2);


        return Math.exp(
            logDensity
        );

    }


    // --------------------------------------------------------
    // Outer integral
    //
    // F(q) =
    // ∫ innerIntegral(s) * chiDensity(s) ds
    //
    // --------------------------------------------------------

    const lowerS = 0.0001;
    const upperS = 5;

    const outerSteps = 60;

    const h =
        (upperS - lowerS) /
        outerSteps;

    let sum = 0;


    for (
        let i = 0;
        i <= outerSteps;
        i++
    ) {

        const s =
            lowerS + i * h;


        const value =
            innerIntegral(s) *
            chiDensity(s);


        let weight = 1;

        if (
            i !== 0 &&
            i !== outerSteps
        ) {

            weight =
                i % 2 === 0
                    ? 2
                    : 4;

        }


        sum +=
            weight * value;

    }


    let result =
        sum * h / 3;


    // Numerical integration can produce tiny
    // values outside [0,1].

    return Math.max(
        0,
        Math.min(
            1,
            result
        )
    );

}



// ============================================================
// STUDENTIZED RANGE QUANTILE
//
// Finds q such that:
//
// P(Q <= q) = probability
//
// Equivalent conceptually to R's qtukey()
// ============================================================

function studentizedRangeInv(
    probability,
    k,
    df
) {

    if (
        !Number.isFinite(probability) ||
        probability <= 0 ||
        probability >= 1
    ) {

        throw new Error(
            "Probability must be between 0 and 1."
        );

    }


    if (
        !Number.isInteger(k) ||
        k < 2
    ) {

        throw new Error(
            "Number of means k must be at least 2."
        );

    }


    if (
        !Number.isFinite(df) ||
        df <= 0
    ) {

        throw new Error(
            "Degrees of freedom must be greater than 0."
        );

    }


    // --------------------------------------------------------
    // Special case k = 2
    // --------------------------------------------------------

    if (k === 2) {

        return (
            Math.sqrt(2) *
            jStat.studentt.inv(
                (1 + probability) / 2,
                df
            )
        );

    }


    // --------------------------------------------------------
    // Find an upper bound
    // --------------------------------------------------------

    let lower = 0;
    let upper = 10;


    while (
        studentizedRangeCDF(
            upper,
            k,
            df
        ) < probability
    ) {

        upper *= 1.5;


        if (upper > 100) {

            throw new Error(
                "Unable to bracket studentized-range quantile."
            );

        }

    }


    // --------------------------------------------------------
    // Bisection
    //
    // Stable and reliable for a statistical calculator.
    // --------------------------------------------------------

    for (
        let iteration = 0;
        iteration < 45;
        iteration++
    ) {

        const mid =
            (lower + upper) / 2;


        const cdf =
            studentizedRangeCDF(
                mid,
                k,
                df
            );


        if (
            cdf < probability
        ) {

            lower = mid;

        } else {

            upper = mid;

        }


        if (
            Math.abs(
                upper - lower
            ) < 1e-7
        ) {

            break;

        }

    }


    return (
        lower + upper
    ) / 2;

}

// ============================================================
// TUKEY HSD / TUKEY-KRAMER COMPARISONS
// ============================================================

function generateTukeyComparisons(
    groups,
    anova,
    alpha
) {

    let comparisons = [];


    const k =
        groups.length;


    const dfWithin =
        anova.dfWithin;


    const MSwithin =
        anova.MSwithin;


    if (k < 2) {

        throw new Error(
            "Tukey test requires at least two treatment groups."
        );

    }


    if (
        !Number.isFinite(dfWithin) ||
        dfWithin <= 0
    ) {

        throw new Error(
            "Invalid error degrees of freedom."
        );

    }


    if (
        !Number.isFinite(MSwithin) ||
        MSwithin < 0
    ) {

        throw new Error(
            "Invalid error mean square."
        );

    }


    // --------------------------------------------------------
    // Studentized-range critical value
    // --------------------------------------------------------

    const qValue =
        studentizedRangeInv(
            1 - alpha,
            k,
            dfWithin
        );


    // --------------------------------------------------------
    // Pairwise Tukey-Kramer comparisons
    // --------------------------------------------------------

    for (
        let i = 0;
        i < groups.length - 1;
        i++
    ) {

        for (
            let j = i + 1;
            j < groups.length;
            j++
        ) {


            const mean1 =
                calculateMean(
                    groups[i].values
                );


            const mean2 =
                calculateMean(
                    groups[j].values
                );


            const n1 =
                groups[i].values.length;


            const n2 =
                groups[j].values.length;


            // ------------------------------------------------
            // Tukey-Kramer critical difference
            // ------------------------------------------------

            const hsd =
                qValue *
                Math.sqrt(
                    (MSwithin / 2) *
                    (
                        (1 / n1) +
                        (1 / n2)
                    )
                );


            const difference =
                Math.abs(
                    mean1 - mean2
                );


            comparisons.push({

                treatment1:
                    groups[i].name,

                treatment2:
                    groups[j].name,

                meanDifference:
                    difference,

                criticalValue:
                    hsd,

                significant:
                    difference > hsd

            });

        }

    }


    return comparisons;

}