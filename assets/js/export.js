const exportBtn = document.getElementById("exportCSV");


if(exportBtn){


exportBtn.addEventListener("click",()=>{


    const resultsElement = document.getElementById("results");

    const tables = document.querySelectorAll("#results table");

    if(!resultsElement || tables.length < 2){

        alert("Please run analysis first.");

        return;

    }


    let workbook =
    XLSX.utils.book_new();


    let data = [];


    data.push(
        ["Teegreen One-Way ANOVA + Post-hoc Test Calculator"]
    );


    data.push([]);


    // ========================================================
    // MEAN ± SD RESULTS
    // ========================================================

    data.push(
        ["Mean ± SD Results"]
    );


    data.push(
        ["Treatment","Replicates (n)","Mean ± SD"]
    );


    // First table = Mean ± SD

    tables[0]
    .querySelectorAll("tr")
    .forEach((row,index)=>{


        if(index > 0){

            let cells =
            row.querySelectorAll("td");


            data.push([

                cells[0].innerText,

                cells[1].innerText,

                toSuperscript(
                    cells[2].innerText
                )

            ]);

        }

    });


    data.push([]);


    // ========================================================
    // POST-HOC COMPARISONS
    // ========================================================

    if(
        window.posthocComparisons &&
        window.posthocComparisons.length > 0
    ){


        data.push(
            ["Post-hoc Comparison"]
        );


        data.push([

            "Comparison",

            "Mean Difference",

            "Critical Difference",

            "Significant?"

        ]);


        window.posthocComparisons.forEach(item=>{


            data.push([

                `${item.treatment1} vs ${item.treatment2}`,

                item.meanDifference.toFixed(4),

                item.criticalValue.toFixed(4),

                item.significant
                    ? "Yes"
                    : "No"

            ]);


        });


        data.push([]);

    }


    // ========================================================
    // ANOVA RESULT
    // ========================================================

    data.push(
        ["ANOVA Result"]
    );


    // The ANOVA table is the last table
    // in the results section.

    let anovaTable =
    tables[tables.length - 1];


    anovaTable
    .querySelectorAll("tr")
    .forEach(row=>{


        let rowData = [];


        row.querySelectorAll("th,td")
        .forEach(cell=>{


            rowData.push(
                cell.innerText
            );


        });


        data.push(rowData);


    });


    // ========================================================
    // CREATE WORKSHEET
    // ========================================================

    let worksheet =
    XLSX.utils.aoa_to_sheet(data);


    worksheet["!cols"] = [

        {wch:32},

        {wch:18},

        {wch:25},

        {wch:18},

        {wch:18},

        {wch:18},

        {wch:15}

    ];


    XLSX.utils.book_append_sheet(

        workbook,

        worksheet,

        "ANOVA Result"

    );


    XLSX.writeFile(

        workbook,

        "Teegreen_ANOVA_Result.xlsx"

    );


});


}



// ============================================================
// SUPERSCRIPT LETTER CONVERTER
// ============================================================

function toSuperscript(text){


    const map = {

        "a":"ᵃ",

        "b":"ᵇ",

        "c":"ᶜ",

        "d":"ᵈ",

        "e":"ᵉ",

        "f":"ᶠ",

        "g":"ᵍ"

    };


    return text.replace(

        /([a-z]+)$/i,

        match =>

        match
        .toLowerCase()
        .split("")
        .map(letter=>
            map[letter] || letter
        )
        .join("")

    );


}