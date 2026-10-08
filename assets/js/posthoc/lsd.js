// Check if all treatments have equal replicates

function checkEqualReplicates(groups){

    let firstReplicate =
    groups[0].values.length;


    return groups.every(group =>
        group.values.length === firstReplicate
    );

}



// Equal replicate LSD

function calculateEqualLSD(groups, anova, alpha){

    let replicate =
    groups[0].values.length;


    let tValue =
    jStat.studentt.inv(
        1 - alpha / 2,
        anova.dfWithin
    );


    return (
        tValue *
        Math.sqrt(
            (2 * anova.MSwithin) /
            replicate
        )
    );

}



// Unequal replicate pairwise LSD

function calculatePairwiseLSD(group1, group2, anova, alpha){

    let n1 =
    group1.values.length;


    let n2 =
    group2.values.length;


    let tValue =
    jStat.studentt.inv(
        1 - alpha / 2,
        anova.dfWithin
    );


    return (
        tValue *
        Math.sqrt(
            anova.MSwithin *
            (
                (1 / n1) +
                (1 / n2)
            )
        )
    );

}



// Generate all LSD comparisons

function generateLSDComparisons(groups, anova, alpha){

    let comparisons = [];

    const equalReplicates = checkEqualReplicates(groups);

    let equalLSD = null;

    if(equalReplicates){
        equalLSD = calculateEqualLSD(groups, anova, alpha);
    }

    for(let i = 0; i < groups.length - 1; i++){

        for(let j = i + 1; j < groups.length; j++){

            let mean1 = calculateMean(groups[i].values);

            let mean2 = calculateMean(groups[j].values);

            let difference = Math.abs(mean1 - mean2);

            let lsd = equalReplicates
                ? equalLSD
                : calculatePairwiseLSD(
                    groups[i],
                    groups[j],
                    anova,
                    alpha
                );

            comparisons.push({

                treatment1: groups[i].name,

                treatment2: groups[j].name,

                meanDifference: difference,

                criticalValue: lsd,

                significant: difference > lsd

            });

        }

    }

    return comparisons;

}