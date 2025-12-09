// Comprehensive Question Bank for Chem 1A Tutor
// Each section contains a large pool of questions for randomization

const questionBank = {
    'atomic-structure': [
        // Conceptual
        {
            type: 'multiple-choice',
            question: 'Which of the following elements has the largest atomic radius?',
            options: ['Lithium (Li)', 'Sodium (Na)', 'Potassium (K)', 'Rubidium (Rb)'],
            correct: 3,
            explanation: 'Atomic radius increases down a group. Rubidium is furthest down Group 1, so it has the largest atomic radius among these elements.'
        },
        {
            type: 'multiple-choice',
            question: 'What is the electron configuration of a neutral oxygen atom (O, atomic number 8)?',
            options: ['1s² 2s² 2p⁴', '1s² 2s² 2p⁶', '1s² 2s² 2p³', '1s² 2s² 2p⁵'],
            correct: 0,
            explanation: 'Oxygen has 8 electrons. Following the Aufbau principle: 1s² (2 electrons), 2s² (2 electrons), 2p⁴ (4 electrons) = 8 total electrons.'
        },
        {
            type: 'multiple-choice',
            question: 'Which element has the highest electronegativity?',
            options: ['Fluorine (F)', 'Oxygen (O)', 'Chlorine (Cl)', 'Nitrogen (N)'],
            correct: 0,
            explanation: 'Fluorine is the most electronegative element on the periodic table.'
        },
        {
            type: 'multiple-choice',
            question: 'Which trend decreases as you move across a period from left to right?',
            options: ['Ionization Energy', 'Atomic Radius', 'Electronegativity', 'Electron Affinity'],
            correct: 1,
            explanation: 'Atomic radius decreases across a period because the increasing nuclear charge pulls electrons closer.'
        },
        {
            type: 'multiple-choice',
            question: 'Isoelectronic species have the same number of:',
            options: ['Protons', 'Neutrons', 'Electrons', 'Isotopes'],
            correct: 2,
            explanation: 'Isoelectronic means "same electronic structure", i.e., same number of electrons.'
        },
        // Mathematical
        {
            type: 'text',
            question: 'How many protons are in the nucleus of a Gold (Au) atom?',
            answer: '79',
            explanation: 'Gold (Au) has an atomic number of 79, which equals the number of protons.',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'How many neutrons are in the isotope Carbon-14 (¹⁴C)?',
            answer: '8',
            explanation: 'Mass number 14 - Atomic number 6 = 8 neutrons.',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'Calculate the average atomic mass of Boron if it exists as 19.9% ¹⁰B (10.013 amu) and 80.1% ¹¹B (11.009 amu). Round to 2 decimals.',
            answer: '10.81',
            explanation: '(0.199 × 10.013) + (0.801 × 11.009) = 1.99 + 8.82 = 10.81 amu.',
            tolerance: 0.05
        },
        {
            type: 'multiple-choice',
            question: 'Which of these is an example of an alkali metal?',
            options: ['Ca', 'Fe', 'K', 'Xe'],
            correct: 2,
            explanation: 'Potassium (K) is in Group 1, making it an alkali metal.'
        },
        {
            type: 'multiple-choice',
            question: 'What is the charge of a standard Calcium ion?',
            options: ['+1', '+2', '-1', '-2'],
            correct: 1,
            explanation: 'Calcium is in Group 2, so it loses 2 electrons to form a Ca²⁺ ion.'
        },
        {
            type: 'text',
            question: 'What is the mass number of an isotope with 92 protons and 143 neutrons?',
            answer: '235',
            explanation: 'Mass number = protons + neutrons = 92 + 143 = 235.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Which element is a noble gas?',
            options: ['Hydrogen', 'Helium', 'Oxygen', 'Fluorine'],
            correct: 1,
            explanation: 'Helium is in Group 18, which contains the noble gases.'
        },
        {
            type: 'multiple-choice',
            question: 'Which group contains the halogens?',
            options: ['Group 1', 'Group 2', 'Group 17', 'Group 18'],
            correct: 2,
            explanation: 'Group 17 elements (F, Cl, Br, I) are known as halogens.'
        },
        {
            type: 'text',
            question: 'How many total electrons does a P³⁻ ion have?',
            answer: '18',
            explanation: 'Phosphorus (P) has 15 protons. A 3- charge means it gained 3 electrons. 15 + 3 = 18 electrons (making it isoelectronic with Argon).',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Which subatomic particle has the smallest mass?',
            options: ['Proton', 'Neutron', 'Electron', 'Alpha particle'],
            correct: 2,
            explanation: 'Electrons have negligible mass compared to protons and neutrons (approx. 1/1836th of a proton).'
        }
    ],

    'orbitals': [
        // Conceptual
        {
            type: 'multiple-choice',
            question: 'What is the shape of an s-orbital?',
            options: ['Dumbbell', 'Spherical', 'Cloverleaf', 'Complex'],
            correct: 1,
            explanation: 's-orbitals are spherical in shape.'
        },
        {
            type: 'multiple-choice',
            question: 'What is the maximum number of electrons that can occupy a single p-orbital?',
            options: ['2', '6', '10', '14'],
            correct: 0,
            explanation: 'Any single orbital (s, p, d, or f) can hold a maximum of 2 electrons with opposite spins.'
        },
        {
            type: 'multiple-choice',
            question: 'How many d-orbitals are there in a d-subshell?',
            options: ['1', '3', '5', '7'],
            correct: 2,
            explanation: 'A d-subshell consists of 5 d-orbitals (xy, yz, xz, x²-y², z²), capable of holding 10 electrons total.'
        },
        {
            type: 'multiple-choice',
            question: 'What is the principal quantum number (n) for the valence shell of Lithium?',
            options: ['1', '2', '3', '4'],
            correct: 1,
            explanation: 'Lithium (Li) is in Period 2, so its valence shell is n=2.'
        },
        {
            type: 'multiple-choice',
            question: 'Which quantum number indicates the shape of the orbital?',
            options: ['Principal (n)', 'Angular Momentum (l)', 'Magnetic (ml)', 'Spin (ms)'],
            correct: 1,
            explanation: 'The angular momentum quantum number (l) determines the shape: l=0 is s (sphere), l=1 is p (dumbbell), etc.'
        },
        {
            type: 'text',
            question: 'What corresponds to l = 2?',
            answer: 'd',
            explanation: 'l values: 0=s, 1=p, 2=d, 3=f.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Which rule states that electrons fill lower energy orbitals first?',
            options: ['Hund\'s Rule', 'Pauli Exclusion Principle', 'Aufbau Principle', 'Heisenberg Uncertainty Principle'],
            correct: 2,
            explanation: 'The Aufbau Principle states that electrons occupy the lowest energy orbitals available first.'
        },
        {
            type: 'multiple-choice',
            question: 'Which electron configuration represents an excited state?',
            options: ['1s² 2s² 2p¹', '1s² 2s² 2p⁶ 3s¹', '1s² 2s² 2p⁵ 3s¹', '1s² 2s²'],
            correct: 2,
            explanation: 'In 1s² 2s² 2p⁵ 3s¹, an electron has jumped from the 2p subshell to the 3s subshell before the 2p was full (which would be 2p⁶).'
        },
        {
            type: 'text',
            question: 'How many valence electrons does Chlorine have?',
            answer: '7',
            explanation: 'Chlorine is in Group 17, so it has 7 valence electrons (3s² 3p⁵).',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'What is the total number of orbitals in the n=3 energy level?',
            answer: '9',
            explanation: 'The number of orbitals in an energy level n is n². For n=3, there are 3² = 9 orbitals (one 3s, three 3p, five 3d).',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Which element has the electron configuration [Ar] 4s² 3d¹⁰ 4p³?',
            options: ['As', 'Se', 'Ge', 'Ga'],
            correct: 0,
            explanation: 'Counting electrons: Argon (18) + 2 + 10 + 3 = 33 electrons. Atomic number 33 is Arsenic (As).'
        },
        {
            type: 'multiple-choice',
            question: 'Identify the element with the configuration 1s² 2s² 2p⁶ 3s² 3p⁶?',
            options: ['Argon', 'Neon', 'Krypton', 'Xenon'],
            correct: 0,
            explanation: 'Count = 18 electrons. Element 18 is Argon.'
        },
        {
            type: 'multiple-choice',
            question: 'Pauli Exclusion Principle states that no two electrons can have the same:',
            options: ['Energy', 'Orbital', 'Set of 4 quantum numbers', 'Spin only'],
            correct: 2,
            explanation: 'Pauli Exclusion Principle: No two electrons in an atom can have identical values for all four quantum numbers.'
        },
        {
            type: 'text',
            question: 'How many unpaired electrons are in a Nitrogen atom?',
            answer: '3',
            explanation: 'N is 1s² 2s² 2p³. By Hund\'s rule, the 3 p-electrons will occupy separate orbitals with parallel spins, so 3 unpaired.'
        },
        {
            type: 'text',
            question: 'What is the maximum number of electrons primarily in the n=2 shell?',
            answer: '8',
            explanation: 'Max electrons = 2n². For n=2, 2(2²) = 8.'
        }
    ],

    'stoichiometry': [
        // Conceptual
        {
            type: 'multiple-choice',
            question: 'The limiting reagent in a chemical reaction is:',
            options: ['The reactant with largest mass', 'The reactant consumed first', 'The reactant left over', 'The product with smallest mass'],
            correct: 1,
            explanation: 'The limiting reagent limits the amount of product formed because it is completely consumed first.'
        },
        {
            type: 'multiple-choice',
            question: 'Which law requires chemical equations to be balanced?',
            options: ['Law of Definite Proportions', 'Law of Conservation of Mass', 'Avogardo\'s Law', 'Boyle\'s Law'],
            correct: 1,
            explanation: 'Matter cannot be created or destroyed, so mass (and number of atoms) must be conserved.'
        },
        // Mathematical
        {
            type: 'text',
            question: 'How many moles are in 22 grams of CO₂? (Molar mass = 44 g/mol)',
            answer: '0.5',
            explanation: 'Moles = Mass / Molar Mass = 22 g / 44 g/mol = 0.5 mol.',
            tolerance: 0.05
        },
        {
            type: 'text',
            question: 'Calculate the molar mass of H₂SO₄. (H=1, S=32, O=16)',
            answer: '98',
            explanation: '2(1) + 32 + 4(16) = 2 + 32 + 64 = 98 g/mol.',
            tolerance: 0.5
        },
        {
            type: 'text',
            question: 'How many grams of N₂ are required to produce 34 g of NH₃? N₂ + 3H₂ → 2NH₃ (NH₃=17 g/mol, N₂=28 g/mol)',
            answer: '28',
            explanation: '34g NH₃ = 2 moles NH₃. Ratio N₂:NH₃ is 1:2. So 1 mole N₂ needed. 1 mole N₂ = 28 g.',
            tolerance: 1
        },
        {
            type: 'multiple-choice',
            question: 'What is the stoichiometric coefficient for O₂ when balancing: C₃H₈ + O₂ → CO₂ + H₂O?',
            options: ['3', '4', '5', '7'],
            correct: 2,
            explanation: 'C₃H₈ + 5O₂ → 3CO₂ + 4H₂O.'
        },
        {
            type: 'text',
            question: 'If theoretical yield is 10g and actual yield is 8g, what is percent yield?',
            answer: '80',
            explanation: '(8 / 10) * 100 = 80%.',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'How many oxygen atoms are in 1 mole of O₂?',
            answer: '1.204e24',
            explanation: '1 mole O₂ = 6.022e23 molecules. Each molecule has 2 atoms. 2 * 6.022e23 = 1.2044e24. Accept scientific notation.'
        },
        {
            type: 'multiple-choice',
            question: 'Avogadro\'s number is approximately:',
            options: ['6.02 x 10^22', '6.02 x 10^23', '3.00 x 10^8', '1.67 x 10^-27'],
            correct: 1,
            explanation: 'NA = 6.022 x 10²³.'
        },
        {
            type: 'text',
            question: 'What is the mass of 0.1 moles of NaCl? (Na=23, Cl=35.5)',
            answer: '5.85',
            explanation: 'Molar mass = 58.5 g/mol. 0.1 mol * 58.5 = 5.85 g.',
            tolerance: 0.1
        },
        {
            type: 'multiple-choice',
            question: 'Empirical formula of Benzene (C₆H₆) is:',
            options: ['CH', 'C₆H₆', 'C₃H₃', 'CH₂'],
            correct: 0,
            explanation: 'Empirical formula is the simplest ratio. 6:6 reduces to 1:1, so CH.'
        },
        {
            type: 'text',
            question: 'Balance the coefficient for H₂ in: N₂ + _H₂ → 2NH₃',
            answer: '3',
            explanation: 'N₂ + 3H₂ → 2NH₃.',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'How many moles of atoms are in 3.011 x 10²³ atoms?',
            answer: '0.5',
            explanation: '3.011e23 / 6.022e23 = 0.5 moles.',
            tolerance: 0.05
        }
    ],

    'thermodynamics': [
        // Conceptual
        {
            type: 'multiple-choice',
            question: 'Which usually implies a spontaneous reaction?',
            options: ['Positive ΔG', 'Negative ΔH only', 'Negative ΔG', 'Positive ΔS only'],
            correct: 2,
            explanation: 'A negative Gibbs Free Energy (ΔG) indicates a spontaneous process.'
        },
        {
            type: 'multiple-choice',
            question: 'Heat absorbed by a system at constant pressure is equal to:',
            options: ['ΔE', 'ΔG', 'ΔH', 'ΔS'],
            correct: 2,
            explanation: 'Enthalpy (ΔH) is defined as the heat transfer at constant pressure.'
        },
        {
            type: 'multiple-choice',
            question: 'Entropy is a measure of:',
            options: ['Heat content', 'Reaction rate', 'Disorder/Randomness', 'Free energy'],
            correct: 2,
            explanation: 'Entropy (S) measures the disorder or number of microstates in a system.'
        },
        // Mathematical
        {
            type: 'text',
            question: 'If ΔH = -50 kJ and ΔS = 0.1 kJ/K, what is ΔG at 300 K? (in kJ)',
            answer: '-80',
            explanation: 'ΔG = ΔH - TΔS = -50 - (300 * 0.1) = -50 - 30 = -80 kJ.',
            tolerance: 1
        },
        {
            type: 'text',
            question: 'How much energy (J) is needed to heat 10g of water by 10°C? (c = 4.18 J/g°C)',
            answer: '418',
            explanation: 'q = mcΔT = 10 * 4.18 * 10 = 418 J.',
            tolerance: 1
        },
        {
            type: 'multiple-choice',
            question: 'An endothermic reaction with a decrease in entropy will be:',
            options: ['Always spontaneous', 'Never spontaneous', 'Spontaneous at high T', 'Spontaneous at low T'],
            correct: 1,
            explanation: 'ΔH > 0 (positive) and ΔS < 0 (negative). ΔG = ΔH - TΔS will always be positive, so never spontaneous.'
        },
        {
            type: 'text',
            question: 'Calculate ΔH for A → C if A → B is -20kJ and B → C is +50kJ (Hess\'s Law).',
            answer: '30',
            explanation: '-20 + 50 = +30 kJ.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Which phase change results in the largest increase in entropy?',
            options: ['Solid to Liquid', 'Liquid to Solid', 'Liquid to Gas', 'Solid to Gas'],
            correct: 3,
            explanation: 'Sublimation (Solid to Gas) involves the greatest increase in disorder.'
        },
        {
            type: 'text',
            question: 'What is the sign of ΔH for freezing water?',
            answer: '-',
            explanation: 'Freezing releases energy (exothermic), so negative.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'At absolute zero (0 K), the entropy of a perfect crystal is:',
            options: ['Infinite', 'Positive', 'Zero', 'Negative'],
            correct: 2,
            explanation: 'Third Law of Thermodynamics: Entropy of a perfect crystal at 0 K is zero.'
        },
        {
            type: 'text',
            question: 'Convert 500 Calories to Joules. (1 Cal = 1000 cal = 4184 J)',
            answer: '2092000',
            explanation: '500 Cal (food calories) = 500,000 cal * 4.184 = 2,092,000 J.',
            tolerance: 1000
        },
        {
            type: 'text',
            question: 'Work done BY the system is typically defined as:',
            answer: 'negative',
            explanation: 'Convention: Work done by system = negative w.',
            tolerance: 0
        }
    ],

    'equilibrium': [
        // Conceptual
        {
            type: 'multiple-choice',
            question: 'If Q < K, the reaction will proceed:',
            options: ['To the left', 'To the right', 'It is at equilibrium', 'It stops'],
            correct: 1,
            explanation: 'Q < K means not enough products. Reaction shifts right to make products.'
        },
        {
            type: 'multiple-choice',
            question: 'Which of these affects the value of the Equilibrium Constant K?',
            options: ['Concentration', 'Pressure', 'Catalyst', 'Temperature'],
            correct: 3,
            explanation: 'Only temperature changes the actual value of K.'
        },
        // Mathematical
        {
            type: 'text',
            question: 'Calculate K if [Products] = 2M and [Reactants] = 1M for A ⇌ B',
            answer: '2',
            explanation: 'K = [B]/[A] = 2/1 = 2.',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'For N₂ + 3H₂ ⇌ 2NH₃, if we double the volume, which way does it shift?',
            answer: 'left',
            explanation: 'Double volume = half pressure. Shift to side with MORE moles of gas. Left (4 moles) vs Right (2 moles). Shifts left.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'In the expression for Kc, solids and pure liquids are:',
            options: ['Included', 'Excluded (set to 1)', 'Squared', 'Negative'],
            correct: 1,
            explanation: 'Solids and liquids have constant concentration so they are omitted (or treated as 1).'
        },
        {
            type: 'text',
            question: 'If K = 10 for forward reaction, what is K\' for the reverse reaction?',
            answer: '0.1',
            explanation: 'Reverse K = 1/K = 1/10 = 0.1.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Le Chatelier Principle: removing product causes shift to:',
            options: ['Reactants', 'Products', 'No shift', 'K changes'],
            correct: 1,
            explanation: 'System tries to replace the removed product, shifting right.',
        },
        {
            type: 'text',
            question: 'Calculate pH of water at 25°C knowing Kw = 1.0 x 10^-14',
            answer: '7',
            explanation: 'Neutral water: [H+] = [OH-] = sqrt(1e-14) = 1e-7. pH = 7.',
            tolerance: 0.1
        },
        {
            type: 'multiple-choice',
            question: 'A large K (K > 10^3) implies:',
            options: ['Mostly reactants at equilibrium', 'Mostly products at equilibrium', 'reaction is slow', 'reaction is fast'],
            correct: 1,
            explanation: 'Large K means numerator (products) is much bigger than denominator.'
        },
        {
            type: 'multiple-choice',
            question: 'Adding an inert gas (He) at constant volume:',
            options: ['Shifts left', 'Shifts right', 'No change', 'Increases K'],
            correct: 2,
            explanation: 'Inert gas changes total pressure but not partial pressures of reacting species at constant volume. No shift.'
        },
        {
            type: 'text',
            question: 'If Kp = Kc(RT)^Δn, what is Δn for 2A(g) → B(g)?',
            answer: '-1',
            explanation: 'Products moles (1) - Reactant moles (2) = -1.',
            tolerance: 0
        }
    ],

    'acids-bases': [
        // Conceptual
        {
            type: 'multiple-choice',
            question: 'Bronsted-Lowry Base is defined as:',
            options: ['Electron pair donor', 'Proton acceptor', 'Proton donor', 'OH- producer'],
            correct: 1,
            explanation: 'Bronsted-Lowry Base accepts a proton (H+).'
        },
        {
            type: 'multiple-choice',
            question: 'Strong acids:',
            options: ['Partially dissociate', 'Completely dissociate', 'Have high pKa', 'Are good buffers'],
            correct: 1,
            explanation: 'Strong acids like HCl dissociate 100% in water.'
        },
        // Mathematical
        {
            type: 'text',
            question: 'What is the pH of 0.01 M HCl?',
            answer: '2',
            explanation: 'HCl is strong. [H+] = 0.01 = 10^-2. pH = 2.',
            tolerance: 0.1
        },
        {
            type: 'text',
            question: 'What is the conjugate base of H₂SO₄?',
            answer: 'HSO4-',
            explanation: 'Remove one H+ to get the conjugate base.',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'If pH = 9, what is pOH?',
            answer: '5',
            explanation: 'pH + pOH = 14. 14 - 9 = 5.',
            tolerance: 0.1
        },
        {
            type: 'multiple-choice',
            question: 'Which of these is a weak acid?',
            options: ['HCl', 'HNO3', 'CH3COOH (Acetic)', 'H2SO4'],
            correct: 2,
            explanation: 'Acetic acid is a classic weak organic acid.'
        },
        {
            type: 'text',
            question: 'Calculate [H+] if pH = 3.',
            answer: '0.001',
            explanation: '10^-3 = 0.001 M.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'A buffer is made of:',
            options: ['Strong Acid + Strong Base', 'Weak Acid + Strong Acid', 'Weak Acid + Conjugate Base', 'Weak Base + Strong Base'],
            correct: 2,
            explanation: 'Buffer needs weak acid/base and its salt (conjugate) to resist pH change.'
        },
        {
            type: 'text',
            question: 'What is the pH of 1.0 M NaOH?',
            answer: '14',
            explanation: 'pOH = -log(1) = 0. pH = 14 - 0 = 14.',
            tolerance: 0.1
        },
        {
            type: 'multiple-choice',
            question: 'Lewis Acid is a:',
            options: ['Proton Donor', 'Electron Pair Acceptor', 'Electron Pair Donor', 'Proton Acceptor'],
            correct: 1,
            explanation: 'Lewis definition focuses on electron pairs. Acid accepts e- pair.'
        },
        {
            type: 'text',
            question: 'Ka * Kb = ?',
            answer: 'Kw',
            explanation: 'Product of acid and conjugate base constants is Kw (1e-14).',
            tolerance: 0
        }
    ],

    'electrochemistry': [
        // Conceptual
        {
            type: 'multiple-choice',
            question: 'Oxidation is:',
            options: ['Gain of electrons', 'Loss of electrons', 'Gain of protons', 'Lowering oxidation number'],
            correct: 1,
            explanation: 'OIL RIG: Oxidation Is Loss, Reduction Is Gain.'
        },
        {
            type: 'multiple-choice',
            question: 'In a galvanic cell, the anode is:',
            options: ['Positive', 'Negative', 'Neutral', 'Where reduction happens'],
            correct: 1,
            explanation: 'In galvanic cells, anode is the source of electrons (oxidation site), labeled negative.'
        },
        // Mathematical
        {
            type: 'text',
            question: 'What is the oxidation state of S in H₂SO₄?',
            answer: '6',
            explanation: 'H=+1(2), O=-2(4)=-8. S must be +6 to be neutral.',
            tolerance: 0
        },
        {
            type: 'text',
            question: 'Calculate E°cell if cathode = 0.80V and anode = -0.76V.',
            answer: '1.56',
            explanation: 'E°cell = E°cath - E°anode = 0.80 - (-0.76) = 1.56V.',
            tolerance: 0.05
        },
        {
            type: 'multiple-choice',
            question: 'Salt bridge function:',
            options: ['Conduct electrons', 'Maintain neutrality', 'Provide energy', 'Speed up reaction'],
            correct: 1,
            explanation: 'Allows ion flow to Balance charge buildup.',
        },
        {
            type: 'text',
            question: 'How many electrons transferred in: Zn -> Zn2+ + 2e-?',
            answer: '2',
            explanation: 'Two electrons.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Standard Hydrogen Electrode potential is defined as:',
            options: ['1.0 V', '0.0 V', '-1.0 V', '0.1 V'],
            correct: 1,
            explanation: 'SHE is the reference zero point (0.00 V).'
        },
        {
            type: 'text',
            question: 'Oxidation state of Cr in Cr₂O₇²⁻?',
            answer: '6',
            explanation: 'O is -2 * 7 = -14. Total = -2. So 2Cr = +12. Cr = +6.',
            tolerance: 0
        },
        {
            type: 'multiple-choice',
            question: 'Which is the strongest oxidizing agent?',
            options: ['F2', 'Li+', 'Zn', 'H2'],
            correct: 0,
            explanation: 'Fluorine wants electrons most desperately (highest reduction potential).'
        },
        {
            type: 'text',
            question: '1 Faraday is approx how many Coulombs?',
            answer: '96485',
            explanation: 'Accept 96500 too typically.',
            tolerance: 100
        }
    ]
};
