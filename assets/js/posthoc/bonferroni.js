function generateBonferroniComparisons(groups, anova, alpha){

    let comparisons=[];


    let pairs =
    (groups.length*(groups.length-1))/2;


    let adjustedAlpha =
    alpha / pairs;



    let tValue =
    jStat.studentt.inv(
        1-adjustedAlpha/2,
        anova.dfWithin
    );



    for(let i=0;i<groups.length-1;i++){


        for(let j=i+1;j<groups.length;j++){


            let n1 =
            groups[i].values.length;


            let n2 =
            groups[j].values.length;



            let critical =
            tValue *
            Math.sqrt(
                anova.MSwithin*
                (
                    (1/n1)+(1/n2)
                )
            );



            let difference =
            Math.abs(
            calculateMean(groups[i].values)
            -
            calculateMean(groups[j].values)
            );



            comparisons.push({

                treatment1:groups[i].name,

                treatment2:groups[j].name,

                meanDifference:difference,

                criticalValue:critical,

                significant:
                difference > critical

            });


        }

    }


    return comparisons;

}