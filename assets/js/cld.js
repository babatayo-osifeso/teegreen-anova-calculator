// ============================================================
// COMPACT LETTER DISPLAY (CLD)
// ============================================================
// Rules:
// 1. Non-significant pairs MUST share at least one letter.
// 2. Significant pairs MUST NOT share any letter.
// 3. Letters are ordered according to treatment mean (highest first).
//
// Expected:
// groups = [
//   { name: "T1", values: [...] },
//   { name: "T2", values: [...] }
// ]
//
// comparisons = [
//   {
//     treatment1: "T1",
//     treatment2: "T2",
//     significant: false
//   }
// ]
//
// calculateMean(values) must already exist in your project.
// ============================================================

function assignLetters(groups, comparisons) {

    if (!Array.isArray(groups) || groups.length === 0) {
        return [];
    }

    // ------------------------------------------------------------
    // 1. Create treatment lookup
    // ------------------------------------------------------------

    const names = groups.map(g => g.name);

    const nameSet = new Set(names);

    const meanMap = {};

    groups.forEach(g => {
        meanMap[g.name] = calculateMean(g.values);
    });


    // ------------------------------------------------------------
    // 2. Create pairwise significance matrix
    // ------------------------------------------------------------

    const significant = {};

    names.forEach(a => {
        significant[a] = {};

        names.forEach(b => {
            significant[a][b] = false;
        });
    });


    comparisons.forEach(c => {

        const a = c.treatment1;
        const b = c.treatment2;

        if (!nameSet.has(a) || !nameSet.has(b) || a === b) {
            return;
        }

        const sig = Boolean(c.significant);

        significant[a][b] = sig;
        significant[b][a] = sig;

    });


    // ------------------------------------------------------------
    // 3. Create graph of NON-SIGNIFICANT relationships
    // ------------------------------------------------------------

    const graph = {};

    names.forEach(name => {
        graph[name] = new Set();
    });


    for (let i = 0; i < names.length; i++) {

        for (let j = i + 1; j < names.length; j++) {

            const a = names[i];
            const b = names[j];

            if (!significant[a][b]) {

                graph[a].add(b);
                graph[b].add(a);

            }

        }

    }


    // ------------------------------------------------------------
    // 4. Generate unique letter names
    // ------------------------------------------------------------

    function getLetter(index) {

        let result = "";

        while (index >= 0) {

            result =
                String.fromCharCode(97 + (index % 26)) +
                result;

            index =
                Math.floor(index / 26) - 1;

        }

        return result;

    }


    // ------------------------------------------------------------
    // 5. Handle trivial cases
    // ------------------------------------------------------------

    // Only one treatment
    if (names.length === 1) {

        return [{
            name: names[0],
            letter: "a"
        }];

    }


    // ------------------------------------------------------------
    // 6. Find maximal cliques
    // ------------------------------------------------------------
    //
    // Every letter represents a group of treatments that are
    // mutually non-significantly different.
    //
    // Therefore every letter must correspond to a clique in
    // the non-significant graph.
    // ------------------------------------------------------------

    const cliques = [];


    function bronKerbosch(R, P, X) {

        if (P.size === 0 && X.size === 0) {

            if (R.size > 0) {
                cliques.push([...R]);
            }

            return;
        }


        // Choose pivot with largest number of neighbours in P.
        // This substantially reduces unnecessary recursion.

        let pivot = null;
        let maxConnections = -1;

        const unionPX = new Set([
            ...P,
            ...X
        ]);

        unionPX.forEach(v => {

            let count = 0;

            graph[v].forEach(n => {

                if (P.has(n)) {
                    count++;
                }

            });

            if (count > maxConnections) {

                maxConnections = count;
                pivot = v;

            }

        });


        const candidates = pivot === null
            ? [...P]
            : [...P].filter(v => !graph[pivot].has(v));


        candidates.forEach(v => {

            const newR = new Set(R);
            newR.add(v);


            const newP = new Set(
                [...P].filter(n =>
                    graph[v].has(n)
                )
            );


            const newX = new Set(
                [...X].filter(n =>
                    graph[v].has(n)
                )
            );


            bronKerbosch(
                newR,
                newP,
                newX
            );


            P.delete(v);
            X.add(v);

        });

    }


    bronKerbosch(
        new Set(),
        new Set(names),
        new Set()
    );


    // ------------------------------------------------------------
    // 7. Remove duplicate cliques
    // ------------------------------------------------------------

    const uniqueCliqueMap = new Map();

    cliques.forEach(clique => {

        const key = [...clique]
            .sort()
            .join("\u0001");

        uniqueCliqueMap.set(key, clique);

    });


    let maximalCliques = [
        ...uniqueCliqueMap.values()
    ];


    // ------------------------------------------------------------
    // 8. Remove cliques that are strict subsets of another clique
    // ------------------------------------------------------------

    maximalCliques = maximalCliques.filter((clique, index) => {

        return !maximalCliques.some((other, otherIndex) => {

            if (index === otherIndex) {
                return false;
            }

            if (other.length <= clique.length) {
                return false;
            }

            return clique.every(x =>
                other.includes(x)
            );

        });

    });


    // ------------------------------------------------------------
    // 9. Add singleton cliques
    // ------------------------------------------------------------
    //
    // This guarantees that every treatment receives at least
    // one letter, even if it is significantly different from
    // every other treatment.
    // ------------------------------------------------------------

    names.forEach(name => {

        const exists = maximalCliques.some(clique =>
            clique.includes(name)
        );

        if (!exists) {
            maximalCliques.push([name]);
        }

    });


    // ------------------------------------------------------------
    // 10. Build all NON-SIGNIFICANT pairs that must be covered
    // ------------------------------------------------------------

    const requiredPairs = [];

    for (let i = 0; i < names.length; i++) {

        for (let j = i + 1; j < names.length; j++) {

            const a = names[i];
            const b = names[j];

            if (!significant[a][b]) {

                requiredPairs.push(
                    [a, b]
                );

            }

        }

    }


    // ------------------------------------------------------------
    // 11. Special case: every pair is significant
    // ------------------------------------------------------------

    if (requiredPairs.length === 0) {

        const ordered = [...groups].sort(
            (a, b) =>
                meanMap[b.name] -
                meanMap[a.name]
        );


        const letters = {};

        ordered.forEach((g, index) => {

            letters[g.name] =
                getLetter(index);

        });


        return groups.map(g => ({
            name: g.name,
            letter: letters[g.name]
        }));

    }


    // ------------------------------------------------------------
    // 12. Determine which required pairs each clique covers
    // ------------------------------------------------------------

    const candidates = maximalCliques.map(clique => {

        const coveredPairs = [];


        requiredPairs.forEach((pair, pairIndex) => {

            const [a, b] = pair;

            if (
                clique.includes(a) &&
                clique.includes(b)
            ) {

                coveredPairs.push(pairIndex);

            }

        });


        return {
            clique,
            coveredPairs
        };

    });


    // ------------------------------------------------------------
    // 13. Remove candidates that cover no required pair
    // ------------------------------------------------------------

    const usefulCandidates =
        candidates.filter(c =>
            c.coveredPairs.length > 0
        );


    // ------------------------------------------------------------
    // 14. Find a compact clique cover
    // ------------------------------------------------------------
    //
    // We first try an exact search.
    // If the problem becomes too large, we use a greedy
    // fallback that still produces a VALID CLD.
    // ------------------------------------------------------------

    let bestCover = null;

    let searchNodes = 0;

    const MAX_SEARCH_NODES = 100000;


    // ------------------------------------------------------------
    // 15. Greedy valid fallback
    // ------------------------------------------------------------

    function greedyCover() {

        const uncovered = new Set(
            requiredPairs.map((_, i) => i)
        );

        const selected = [];


        while (uncovered.size > 0) {

            let best = null;
            let bestScore = -1;


            usefulCandidates.forEach(candidate => {

                let score = 0;

                candidate.coveredPairs.forEach(index => {

                    if (uncovered.has(index)) {
                        score++;
                    }

                });


                // Prefer larger cliques when coverage is equal.
                const tieBreaker =
                    candidate.clique.length * 0.001;


                if (
                    score + tieBreaker >
                    bestScore
                ) {

                    bestScore =
                        score + tieBreaker;

                    best = candidate;

                }

            });


            // Safety fallback
            if (!best || bestScore <= 0) {
                break;
            }


            selected.push(best.clique);


            best.coveredPairs.forEach(index => {
                uncovered.delete(index);
            });

        }


        return selected;

    }


    // ------------------------------------------------------------
    // 16. Exact minimum clique cover search
    // ------------------------------------------------------------

    function exactCover(uncovered, chosen, startIndex) {

        searchNodes++;

        if (searchNodes > MAX_SEARCH_NODES) {
            return;
        }


        // Everything covered
        if (uncovered.size === 0) {

            if (
                bestCover === null ||
                chosen.length < bestCover.length
            ) {

                bestCover = [...chosen];

            }

            return;

        }


        // Can't improve existing solution
        if (
            bestCover !== null &&
            chosen.length >= bestCover.length
        ) {

            return;

        }


        // Find the uncovered pair with the fewest candidate cliques.
        // This dramatically reduces branching.

        let targetPair = null;
        let targetCandidates = null;


        for (const pairIndex of uncovered) {

            const available = [];


            for (
                let i = 0;
                i < usefulCandidates.length;
                i++
            ) {

                if (i < startIndex) {
                    continue;
                }


                if (
                    usefulCandidates[i]
                        .coveredPairs
                        .includes(pairIndex)
                ) {

                    available.push(i);

                }

            }


            if (
                targetCandidates === null ||
                available.length <
                targetCandidates.length
            ) {

                targetPair = pairIndex;
                targetCandidates = available;

            }


            if (
                targetCandidates &&
                targetCandidates.length === 1
            ) {
                break;
            }

        }


        if (
            targetPair === null ||
            !targetCandidates ||
            targetCandidates.length === 0
        ) {
            return;
        }


        // Try larger cliques first
        targetCandidates.sort(
            (a, b) =>
                usefulCandidates[b]
                    .clique.length -
                usefulCandidates[a]
                    .clique.length
        );


        for (const candidateIndex of targetCandidates) {

            const candidate =
                usefulCandidates[candidateIndex];


            const nextUncovered =
                new Set(uncovered);


            candidate.coveredPairs.forEach(index => {
                nextUncovered.delete(index);
            });


            exactCover(
                nextUncovered,
                [
                    ...chosen,
                    candidate.clique
                ],
                candidateIndex + 1
            );


            if (searchNodes > MAX_SEARCH_NODES) {
                return;
            }

        }

    }


    // Start exact search
    exactCover(
        new Set(
            requiredPairs.map((_, i) => i)
        ),
        [],
        0
    );


    // If exact search timed out or failed,
    // use the guaranteed-valid greedy construction.

    if (bestCover === null) {
        bestCover = greedyCover();
    }


    // ------------------------------------------------------------
    // 17. Ensure every treatment appears in at least one letter
    // ------------------------------------------------------------

    const coveredTreatments = new Set();

    bestCover.forEach(clique => {

        clique.forEach(name => {
            coveredTreatments.add(name);
        });

    });


    names.forEach(name => {

        if (!coveredTreatments.has(name)) {

            bestCover.push([name]);

        }

    });


    // ------------------------------------------------------------
    // 18. SWEEPING STEP
    // ------------------------------------------------------------
    //
    // Remove redundant treatment memberships while preserving
    // the validity of the display.
    //
    // This is based on the sweeping idea described by Piepho.
    // ------------------------------------------------------------

    let changed = true;


    while (changed) {

        changed = false;


        for (
            let letterIndex = 0;
            letterIndex < bestCover.length;
            letterIndex++
        ) {

            const clique = bestCover[letterIndex];


            for (
                let memberIndex = clique.length - 1;
                memberIndex >= 0;
                memberIndex--
            ) {

                const treatment =
                    clique[memberIndex];


                // Never remove the treatment if this clique
                // is its only current membership.

                const membershipCount =
                    bestCover.filter(c =>
                        c.includes(treatment)
                    ).length;


                if (membershipCount <= 1) {
                    continue;
                }


                const remaining =
                    clique.filter((_, i) =>
                        i !== memberIndex
                    );


                let canRemove = true;


                // Every other treatment in this clique must
                // still share another letter with treatment.

                for (const other of remaining) {

                    const hasAlternative =
                        bestCover.some(
                            (otherClique, otherIndex) => {

                                if (
                                    otherIndex ===
                                    letterIndex
                                ) {
                                    return false;
                                }

                                return (
                                    otherClique.includes(treatment) &&
                                    otherClique.includes(other)
                                );

                            }
                        );


                    if (!hasAlternative) {

                        canRemove = false;
                        break;

                    }

                }


                if (canRemove) {

                    clique.splice(memberIndex, 1);
                    changed = true;

                }

            }

        }

    }


    // Remove empty cliques
    bestCover =
        bestCover.filter(c =>
            c.length > 0
        );


    // ------------------------------------------------------------
    // 19. Final VALIDITY CHECK
    // ------------------------------------------------------------
    //
    // This is important.
    //
    // If the generated letters ever violate the pairwise
    // significance matrix, throw an error instead of silently
    // showing incorrect statistics.
    // ------------------------------------------------------------

    function shareLetter(a, b) {

        return bestCover.some(clique =>
            clique.includes(a) &&
            clique.includes(b)
        );

    }


    for (let i = 0; i < names.length; i++) {

        for (let j = i + 1; j < names.length; j++) {

            const a = names[i];
            const b = names[j];

            const shares =
                shareLetter(a, b);


            // Significant pair MUST NOT share a letter
            if (
                significant[a][b] &&
                shares
            ) {

                throw new Error(
                    `CLD validation failed: ` +
                    `${a} and ${b} are significantly different ` +
                    `but share a letter.`
                );

            }


            // Non-significant pair MUST share a letter
            if (
                !significant[a][b] &&
                !shares
            ) {

                throw new Error(
                    `CLD validation failed: ` +
                    `${a} and ${b} are not significantly different ` +
                    `but do not share a letter.`
                );

            }

        }

    }


    // ------------------------------------------------------------
    // 20. Order letters by highest treatment mean
    // ------------------------------------------------------------

    const orderedGroups =
        [...groups].sort(
            (a, b) =>
                meanMap[b.name] -
                meanMap[a.name]
        );


    // Sort the cliques by the highest mean treatment they contain.
    // This makes "a" naturally start with the highest mean group.

    bestCover.sort((a, b) => {

        const maxA =
            Math.max(
                ...a.map(name =>
                    meanMap[name]
                )
            );

        const maxB =
            Math.max(
                ...b.map(name =>
                    meanMap[name]
                )
            );
        
        return maxB - maxA;

    });


    // ------------------------------------------------------------
    // 21. Assign actual letters
    // ------------------------------------------------------------

    const letterMap = {};


    bestCover.forEach((clique, index) => {

        const letter =
            getLetter(index);


        clique.forEach(name => {

            if (!letterMap[name]) {
                letterMap[name] = [];
            }


            letterMap[name].push(letter);

        });

    });


    // ------------------------------------------------------------
    // 22. Return in ORIGINAL group order
    // ------------------------------------------------------------

    return groups.map(g => {

        const letters =
            letterMap[g.name] || [];


        return {

            name: g.name,

            letter:
                [...new Set(letters)]
                    .sort()
                    .join("")

        };

    });

}

 