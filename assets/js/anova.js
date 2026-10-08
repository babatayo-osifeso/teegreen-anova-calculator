function mean(values){

    return values.reduce((a,b)=>a+b,0) / values.length;

}



function standardDeviation(values){

    let avg = mean(values);

    let variance = values.reduce((sum,value)=>{

        return sum + Math.pow(value-avg,2);

    },0)/(values.length-1);


    return Math.sqrt(variance);

}




function oneWayANOVA(groups, alpha){


    let allValues = [];


    groups.forEach(group=>{

        allValues.push(...group.values);

    });



    let grandMean = mean(allValues);


    let k = groups.length;

    let N = allValues.length;



    // Between group SS

    let SSbetween = 0;


    groups.forEach(group=>{

        let groupMean = mean(group.values);


        SSbetween += group.values.length *
        Math.pow(groupMean-grandMean,2);

    });



    // Within group SS

    let SSwithin = 0;


    groups.forEach(group=>{


        let groupMean = mean(group.values);


        group.values.forEach(value=>{


            SSwithin += Math.pow(value-groupMean,2);


        });


    });



    // Total SS

    let SStotal = SSbetween + SSwithin;



    // Degrees of freedom

    let dfBetween = k - 1;

    let dfWithin = N - k;

    let dfTotal = N - 1;



    // Mean squares

    let MSbetween = SSbetween / dfBetween;

    let MSwithin = SSwithin / dfWithin;



    // F calculated

    let Fcalculated = MSbetween / MSwithin;



    // F tabulated

    let Ftabulated = jStat.centralF.inv(
        1-alpha,
        dfBetween,
        dfWithin
    );



    // P value

    let pValue =
    1 - jStat.centralF.cdf(
        Fcalculated,
        dfBetween,
        dfWithin
    );



    return {

        SSbetween,
        SSwithin,
        SStotal,

        dfBetween,
        dfWithin,
        dfTotal,

        MSbetween,
        MSwithin,

        Fcalculated,
        Ftabulated,

        pValue

    };


}