const groupsContainer = document.getElementById("groupsContainer");

const addGroupBtn = document.getElementById("addGroup");
const exampleBtn = document.getElementById("exampleData");
const clearBtn = document.getElementById("clearAll");
const analyzeBtn = document.getElementById("analyze");

const results = document.getElementById("results");

const mobileMenuToggle =
document.querySelector(".mobile-menu-toggle");

const primaryNavigation =
document.getElementById("primary-navigation");


function closeMobileMenu(){

    if(!mobileMenuToggle || !primaryNavigation){
        return;
    }

    primaryNavigation.classList.remove("is-open");
    mobileMenuToggle.setAttribute("aria-expanded","false");
    mobileMenuToggle.setAttribute("aria-label","Open navigation menu");
    document.body.classList.remove("menu-open");
}


if(mobileMenuToggle && primaryNavigation){

    mobileMenuToggle.addEventListener("click",()=>{

        const isOpen =
        mobileMenuToggle.getAttribute("aria-expanded") === "true";

        mobileMenuToggle.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );

        mobileMenuToggle.setAttribute(
            "aria-label",
            isOpen
            ? "Open navigation menu"
            : "Close navigation menu"
        );

        primaryNavigation.classList.toggle(
            "is-open",
            !isOpen
        );

        document.body.classList.toggle(
            "menu-open",
            !isOpen
        );

    });


    primaryNavigation.querySelectorAll("a").forEach(link=>{

        link.addEventListener("click",closeMobileMenu);

    });


    document.addEventListener("keydown",(event)=>{

        if(event.key === "Escape"){
            closeMobileMenu();
        }

    });

}




// Create new treatment group

function createGroup(){

    const group = document.createElement("div");

    group.classList.add("group");

    group.innerHTML = `

        <div class="group-header">

            <div class="group-title">

                <span class="group-number">
                    00
                </span>

                <h3 class="treatmentNumber">
                    Treatment
                </h3>

            </div>

        </div>


        <div class="input-group">

            <label>
                Treatment Name
            </label>

            <input
                type="text"
                class="groupName"
                placeholder="e.g. Treatment A"
                autocomplete="off"
            >

        </div>


        <div class="input-group">

            <label>
                Replicate Values
            </label>

            <textarea
                class="dataInput"
                placeholder="Enter replicate values"
            
            ></textarea>

            <span class="input-help">
                Enter all observations/replicates for this treatment.
            </span>

        </div>


        <button
            type="button"
            class="removeGroup"
        >
            <span aria-hidden="true">&alpha;</span>
            Remove Treatment
        </button>

    `;

    return group;

}

groupsContainer.addEventListener("input", (event) => {

    if (!event.target.classList.contains("dataInput")) {
        return;
    }

    event.target.value = event.target.value.replace(
        /[^0-9.,\s-]/g,
        ""
    );

});




// Update treatment numbers

function updateTreatmentNumbers(){

    const groups =
    document.querySelectorAll(".group");


    groups.forEach((group,index)=>{

        const number = String(index + 1).padStart(2, "0");

        const title = group.querySelector(".treatmentNumber");
        const numberElement = group.querySelector(".group-number");

        if (title) {
            title.textContent = `Treatment ${index + 1}`;
        }

        if (numberElement) {
            numberElement.textContent = number;
        }

    });

}





// Add treatment

addGroupBtn.addEventListener("click",()=>{

    groupsContainer.appendChild(
        createGroup()
    );


    updateTreatmentNumbers();

});







// Remove treatment

groupsContainer.addEventListener("click",(event)=>{


    if(event.target.classList.contains("removeGroup")){


        const groups =
        document.querySelectorAll(".group");


        if(groups.length > 2){


            event.target.parentElement.remove();

            updateTreatmentNumbers();


        }else{

            alert(
            "At least two treatment groups are required."
            );

        }


    }


});







// Clean data input

function parseData(input){

    return input

    .replace(/,/g," ")

    .trim()

    .split(/\s+/)

    .map(Number)

    .filter(value=>!isNaN(value));

}

function calculateMean(values){

    return values.reduce((a,b)=>a+b,0) / values.length;

}



function calculateSD(values){

    let mean = calculateMean(values);


    let variance =
    values.reduce((sum,value)=>{

        return sum + Math.pow(value - mean,2);

    },0) / (values.length - 1);



    return Math.sqrt(variance);

}







// Collect data

function collectData(){


    const names =
    document.querySelectorAll(".groupName");


    const inputs =
    document.querySelectorAll(".dataInput");


    let groups=[];



    for(let i=0;i<names.length;i++){


        let name =
        names[i].value.trim()
        ||
        `Treatment ${i+1}`;



        let values =
        parseData(inputs[i].value);



        if(values.length > 0){


            let duplicate =
            groups.some(group=>
            group.name.toLowerCase()
            ===
            name.toLowerCase()
            );


            if(duplicate){

                alert(
                `Duplicate treatment name: ${name}`
                );

                return [];

            }



            groups.push({

                name:name,

                values:values

            });


        }


    }


    return groups;


}








// Load example data

exampleBtn.addEventListener("click",()=>{


    let groups =
    document.querySelectorAll(".group");



    groups[0].querySelector(".groupName").value =
    "Control";


    groups[0].querySelector(".dataInput").value =
    "10,12,14";



    groups[1].querySelector(".groupName").value =
    "Treatment A";


    groups[1].querySelector(".dataInput").value =
    "20 22 24";



});








// Clear all

clearBtn.addEventListener("click",()=>{


    groupsContainer.innerHTML="";


    groupsContainer.appendChild(createGroup());

    groupsContainer.appendChild(createGroup());


    updateTreatmentNumbers();


    results.innerHTML="";


});









// Run ANOVA

analyzeBtn.addEventListener("click",()=>{


    let groups =
    collectData();

if(groups.length < 2){

    alert(
        "ANOVA requires at least two treatment groups."
    );

    return;

}

if(groups.some(g=>g.values.length<2)){

    alert(
        "Each treatment must contain at least two replicate values."
    );

    return;

}

if(groups.some(g=>
    g.values.some(v=>!Number.isFinite(v))
)){

    alert(
        "Please enter only valid numeric values."
    );

    return;

}

    



    let alpha =
    Number(
    document.getElementById("alpha").value
    );



    let result =
oneWayANOVA(groups,alpha);


let equalReplicates =
checkEqualReplicates(groups);


let posthoc =
document.getElementById("posthoc").value;


let comparisons;
if(!posthoc){

    alert(
        "Please select a post-hoc test."
    );

    return;

}


if(posthoc==="LSD"){

    comparisons =
    generateLSDComparisons(
        groups,
        result,
        alpha
    );

}


else if(posthoc==="Tukey"){

    comparisons =
    generateTukeyComparisons(
        groups,
        result,
        alpha
    );

}


else if(posthoc==="Bonferroni"){

    comparisons =
    generateBonferroniComparisons(
        groups,
        result,
        alpha
    );

}

window.posthocComparisons = comparisons;


let letters =
assignLetters(
    groups,
    comparisons
);



let posthocSection = "";

let comparisonTable = "";



comparisons.forEach(item => {


    comparisonTable += `

    <tr>

        <td>
        ${item.treatment1} vs ${item.treatment2}
        </td>

        <td>
        ${item.meanDifference.toFixed(4)}
        </td>

        <td>
        ${item.criticalValue.toFixed(4)}
        </td>

        <td>
        ${item.significant ? "Yes" : "No"}
        </td>

    </tr>

    `;


});



// LSD

if(posthoc==="LSD"){


    let equalReplicates =
    checkEqualReplicates(groups);



    let lsdValue =
    equalReplicates

    ?

    calculateEqualLSD(
        groups,
        result,
        alpha
    )

    :

    null;



    posthocSection = `


    <h2>LSD Test Result</h2>



    <p>
    <strong>Replication Type:</strong>
    ${equalReplicates ? "Equal" : "Unequal"}
    </p>



    ${
    equalReplicates

    ?

    `

    <p>
    Aljl treatments contain the same number of replicates.
    A single LSD value was calculated using the common replicate number.
    </p>


    <p>
    <strong>LSD (&alpha; = ${alpha}) =</strong>
    ${lsdValue.toFixed(4)}
    </p>

    `


    :

    `

    <p>
    Treatments contain different numbers of replicates.
    Pairwise LSD comparisons were calculated separately for each treatment comparison using the replicate numbers of the compared treatments.
    </p>

    `

    }



    <table>


    <tr>

    <th>Comparison</th>
    <th>Mean Difference</th>
    <th>LSD</th>
    <th>Significant?</th>

    </tr>



    ${comparisonTable}



    </table>



    <p>
    Treatments with a mean difference greater than the corresponding LSD value are significantly different.
    </p>



    `;


}





// Tukey HSD / Tukey-Kramer

else if(posthoc==="Tukey"){

    posthocSection = `

    <h2>
    ${
        equalReplicates
        ? "Tukey HSD Test Result"
        : "Tukey-Kramer Test Result"
    }
    </h2>


    <p>
    ${
        equalReplicates

        ?

        "Tukey HSD was performed to compare all treatment pairs while controlling the family-wise error rate during multiple comparisons."

        :

        "Tukey-Kramer multiple comparison test was performed to compare treatment pairs while controlling the family-wise error rate for multiple comparisons."
    }
    </p>


    <p>
    Treatments with a mean difference greater than
    the HSD value are significantly different.
    </p>


    <table>

    <tr>

    <th>Comparison</th>
    <th>Mean Difference</th>
    <th>HSD</th>
    <th>Significant?</th>

    </tr>


    ${comparisonTable}


    </table>

    `;
}









// Bonferroni

else if(posthoc==="Bonferroni"){


    posthocSection = `


    <h2>Bonferroni Test Result</h2>



    <p>
    Bonferroni correction was applied to adjust for multiple comparisons and reduce the chance of false significant results.
    </p>



    <p>
    Treatments with a mean difference greater than the Bonferroni-adjusted critical difference are significantly different.
    </p>



    <table>


    <tr>

    <th>Comparison</th>
    <th>Mean Difference</th>
    <th>Bonferroni-adjusted critical difference</th>
    <th>Significant?</th>

    </tr>



    ${comparisonTable}



    </table>


    `;


}

let meanTable = "";


groups.forEach(group=>{


    let mean =
    calculateMean(group.values);


    let sd =
    calculateSD(group.values);



    let letter = "";



    if(letters.length > 0){


        let found =
        letters.find(item=>
        item.name === group.name
        );


        if(found){

            letter =
            found.letter;

        }


    }



    meanTable += `

    <tr>

    <td>${group.name}</td>

    <td>${group.values.length}</td>

    <td>
    ${mean.toFixed(2)} ± ${sd.toFixed(2)}
    <sup>${letter}</sup>
    </td>

    </tr>

    `;


});


    results.innerHTML = `
    <h2>Mean ± SD Results</h2>

<table>

<tr>
<th>Treatment</th>
<th>Replicates (n)</th>
<th>Mean ± SD</th>
</tr>

${meanTable}

</table>

<p>
    Treatments sharing the same superscript letter are not significantly different.
    </p>

    
    ${posthocSection}

<h2> One-Way ANOVA Table</h2>


    <table border="1" cellpadding="8">


    <tr>

    <th>Source</th>
    <th>SS</th>
    <th>df</th>
    <th>MS</th>
    <th>F-calculated</th>
    <th>F-tabulated</th>
    <th>P-value</th>

    </tr>



    <tr>

    <td>Treatment</td>

    <td>${result.SSbetween.toFixed(4)}</td>

    <td>${result.dfBetween}</td>

    <td>${result.MSbetween.toFixed(4)}</td>

    <td rowspan="2">
${
Number.isFinite(result.Fcalculated)
? result.Fcalculated.toFixed(4)
: "∞"
}
</td>

    <td rowspan="2">
${
Number.isFinite(result.Ftabulated)
? result.Ftabulated.toFixed(4)
: "-"
}
</td>

    <td rowspan="2">
${
!Number.isFinite(result.Fcalculated)
? "&lt; 0.0001"
: Number.isNaN(result.pValue)
? "-"
: result.pValue < 0.0001
? "&lt; 0.0001"
: result.pValue.toFixed(4)
}
</td>


    </tr>




    <tr>

    <td>Error</td>

    <td>${result.SSwithin.toFixed(4)}</td>

    <td>${result.dfWithin}</td>

    <td>${result.MSwithin.toFixed(4)}</td>


    </tr>



    <tr>

    <td>Total</td>

    <td>${result.SStotal.toFixed(4)}</td>

    <td>${result.dfTotal}</td>

    <td>-</td>

    <td>-</td>

    <td>-</td>

    <td>-</td>

    </tr>


    </table>




<h3>Conclusion</h3>

<p>

${
!Number.isFinite(result.Fcalculated)

?

`F-calculated (∞) indicates zero within-treatment variation. There is a significant difference among the treatment means at P < ${alpha}.`

:

result.Fcalculated > result.Ftabulated

?

`There is a significant difference among the treatment means at P < ${alpha}. F-calculated (${result.Fcalculated.toFixed(3)}) is greater than F-tabulated (${result.Ftabulated.toFixed(3)}), and p-value(${result.pValue.toFixed(3)}) is less than ${alpha}. Therefore, the null hypothesis is rejected, indicating a significant difference among the treatment means.`

:

`F-calculated (${result.Fcalculated.toFixed(3)}) is less than F-tabulated (${result.Ftabulated.toFixed(3)}). There is no significant difference among the treatment means at P > ${alpha}.`

}

</p>

    `;



});
// Small utility: dynamic copyright year 

const yearElement = document.getElementById("currentYear");

    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
