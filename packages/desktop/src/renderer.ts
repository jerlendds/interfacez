import "./assets/index.css";
import "@nodebody/ui/index.css";
import "@nodebody/editor-markdown/markdown-editor.css";
import { configureContextMenuManager, mount } from "@nodebody/ui";
import {
  createMarkdownEditor,
  gfmMarkdownOptions,
} from "@nodebody/editor-markdown";
import { createDesktopContextMenuBridge } from "./components/context-menu";
import { workbench } from "./components/workbench";

const root = document.querySelector("#app");

if (!root) throw new Error("Missing #app root");

configureContextMenuManager({
  root: document,
  bridge: createDesktopContextMenuBridge(),
});
mount(
  workbench({
    panes: [
      {
        id: "main",
        tabs: [
          {
            id: "readme",
            title: "readme.md",
            resource: "file://readme.md",
            active: true,
            view: createMarkdownEditor({
              document: {
                id: "readme.md",
                title: "readme.md",
                initialText: `
                  I found a recurring pattern: these literatures rarely call the distinction “admissibility.” They use terms such as *feasible layout*, *valid interaction trace*, *accepted task model*, *verified behavior*, *assembly pathway*, *assembly index*, *observable*, *causal intervention*, or *compositional morphism*. But the mathematical structure is close to what you described: a fixed constraint system is studied under different rules for what counts as an allowed solution, trajectory, measurement, or explanation.

## High-value fields and subfields

| Field / subfield                                                      | Shared constraint system                                                                                                    | Different notions of admissibility                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Constraint-based UI layout and computational design in HCI**        | Geometric, linear, hierarchical, and soft/hard constraints over interface elements.                                         | **Local vs global**: early UI systems often used local propagation for interactive performance, while Cassowary handles simultaneous systems of linear constraints with strengths via simplex-style solving. **Finite/discrete vs continuous**: ORC Layout adds OR-constraints to soft/hard linear GUI layout, creating finite alternatives over a continuous layout space. **Differentiable**: Bloom treats layout invariants as optimization constraints solved continuously during interaction using automatic differentiation.  |
| **Automatic / model-based UI generation**                             | Declarative descriptions of tasks, widgets, devices, user capabilities, and cost functions.                                 | **Computable vs optimal vs personalized**: SUPPLE formulates interface generation as a discrete constrained optimization problem over large UI spaces, using branch-and-bound and constraint propagation to generate cost-minimizing interfaces for particular users/devices. This is the same UI constraint system under finite computability, optimization, and user-specific admissibility. ([Intelligent Interactive Systems Group][1])                                                                                         |
| **Formal methods for interactive systems**                            | Interaction traces, state machines, Petri nets, task models, temporal properties, and system-user protocols.                | **Finite vs infinite traces**, **deterministic vs nondeterministic**, **local component behavior vs global workflow**, and **computable verification vs human-realizable interaction**. Recent surveys still frame HCI formal methods around reasoning formally about interaction between systems and users, including verification from models to requirements. ([Springer Nature][2])                                                                                                                                             |
| **Human performance modeling and adaptive interaction**               | Motor, perceptual, cognitive, and attentional constraints on interaction.                                                   | **Measurable vs predictive vs causal**: HCI uses quantitative models such as Fitts’ law and related movement models to predict interaction performance without always running direct experiments; active-inference HCI treats interaction as a closed-loop probabilistic generative process involving agency, adaptation, and engagement. ([York University][3])                                                                                                                                                                    |
| **Causal and experimental HCI**                                       | Design choices, interface variants, behavioral outcomes, and contextual variables.                                          | **Randomized vs observational**, **local mechanism vs global outcome**, **causal vs correlational**. A/B testing treats interface variants as randomized interventions over software constraints, while causal pathway diagrams in human-centered design encode hypothesized causal relations among variables and outcomes. ([ScienceDirect][4])                                                                                                                                                                                    |
| **Compositional / categorical HCI**                                   | Interfaces, actions, events, transformations, and user-system relations.                                                    | **Categorical admissibility**: interaction systems are studied through compositional structure rather than only through execution, optimization, or measurement. There is a small but relevant literature explicitly revisiting category theory as a modeling tool for HCI. ([ACM Digital Library][5])                                                                                                                                                                                                                              |
| **Assembly theory of life / molecular assembly spaces**               | Objects built recursively from elementary building blocks by joining operations, with reuse of previously built subobjects. | **Finite observed object vs assembly universe**, **local join rule vs global shortest path**, **computable index vs physical observability**, **causal history vs static structure**. Assembly theory defines an assembly space as the recursively generated set of pathways producing an object, and the assembly index as the shortest number of joining steps needed to construct it. ([Nature][6])                                                                                                                              |
| **Molecular biosignatures and measurable assembly**                   | Molecular graphs or structures under recursive construction constraints.                                                    | **Measurable admissibility**: molecular assembly number is used as an experimentally motivated biosignature, with mass spectrometry proposed as a route to estimate whether molecules are likely to require life-like production processes. ([Nature][7])                                                                                                                                                                                                                                                                           |
| **Directed, random, and selected assembly processes**                 | The same assembly space, but with different exploration dynamics.                                                           | **Randomized vs deterministic/directed**, **undirected search vs selected production**, **local exploration vs global selection signal**. Assembly-theory work distinguishes random construction from selection-driven exploration, using parameters for discovery and production regimes and comparing undirected versus directed expansion of assembly space.                                                                                                                                                                     |
| **Chemical reaction network theory and origin-of-life dynamics**      | Stoichiometric reaction networks and reaction constraints.                                                                  | **Continuous vs discrete**, **deterministic vs stochastic**, **local vs global detailed balance**. The same reaction network can be treated as deterministic ODE dynamics over concentrations or as a stochastic continuous-time Markov chain over molecule counts; related work distinguishes deterministic, stochastic, local, and global notions of detailed balance.                                                                                                                                                            |
| **Algorithmic information / grammar / compression views of assembly** | Minimal construction of structured objects from reusable parts.                                                             | **Computable vs measurable vs explanatory admissibility**. Critics argue that assembly index is closely related to compression, minimal grammars, or algorithmic-information-theoretic descriptions, while assembly-theory proponents argue the global minimum and physical assembly process remain central and computationally hard. This is one of the clearest places where “same constraint system, different admissibility notion” becomes a live dispute. ([PLOS][8])                                                         |
| **Differentiable and categorical chemistry / molecular programming**  | Chemical reaction networks, open reaction systems, and molecular programs.                                                  | **Differentiable admissibility** appears when reaction networks are relaxed into trainable systems optimized by gradient methods; **categorical admissibility** appears when open reaction networks are composed using categorical constructions such as cospans. ([arXiv][9])                                                                                                                                                                                                                                                      |

## Direct mapping to your admissibility notions

| Notion             | HCI examples                                                                                                                                       | Assembly-theory / life examples                                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Computable**     | Branch-and-bound UI generation; constraint solvers for layouts; model checking of interaction traces. ([Intelligent Interactive Systems Group][1]) | Computing assembly index or bounded assembly paths; recent work frames exact assembly-index computation as computationally hard. ([Nature][10])                                                                                                |
| **Measurable**     | User studies, task completion, error rates, movement time, A/B testing. ([York University][3])                                                     | Molecular assembly number estimated from molecular structure and proposed experimental measurements such as mass spectrometry. ([Nature][7])                                                                                                   |
| **Continuous**     | Continuous layout optimization; differentiable interactive diagrams; pointer/motor models. ([Kilthub][11])                                         | Deterministic CRN models using ODEs over continuous concentrations.                                                                                                                                                                            |
| **Finite**         | Finite widget alternatives, finite UI states, finite experimental variants, finite task models. ([Yue Jiang][12])                                  | Finite molecules, finite assembly pathways, finite observed assembly subspaces.                                                                                                                                                                |
| **Infinite**       | Infinite or unbounded interaction traces in reactive systems; adaptive interfaces over ongoing use. ([Springer Nature][2])                         | The assembly universe: all possible recursively assembled pathways from a basis of building blocks. ([Nature][6])                                                                                                                              |
| **Local**          | Local propagation constraints; widget-level or component-level interaction rules.                                                                  | Local joining operations; local detailed balance in CRNs. ([Nature][6])                                                                                                                                                                        |
| **Global**         | Global layout optimization; global workflow verification; whole-interface cost minimization. ([Intelligent Interactive Systems Group][1])          | Global shortest assembly path; global assembly index; global potentials in reaction-network theory.                                                                                                                                            |
| **Randomized**     | A/B testing; probabilistic user models; stochastic adaptation. ([ScienceDirect][4])                                                                | Random assembly-space exploration; stochastic CRNs / CTMCs.                                                                                                                                                                                    |
| **Deterministic**  | Deterministic layout solvers; deterministic task models; formal verification.                                                                      | Deterministic ODE reaction networks; directed assembly models.                                                                                                                                                                                 |
| **Causal**         | Causal pathway diagrams, intervention models, randomized experiments, active-inference accounts of agency. ([UW Faculty][13])                      | Assembly theory explicitly reframes objects in terms of formation histories and causal constraints; related commentary interprets selection as channeling or constraining underlying generative rules rather than changing them. ([Nature][6]) |
| **Differentiable** | Bloom-style differentiable diagram/layout systems. ([Kilthub][11])                                                                                 | Differentiable CRNs trained by gradient optimization. ([arXiv][9])                                                                                                                                                                             |
| **Categorical**    | Category-theoretic models of HCI and interaction composition. ([ACM Digital Library][5])                                                           | Categorical open reaction networks, cospans, compositional chemistry, and assembly maps between assembly spaces. ([MDPI][14])                                                                                                                  |

## The strongest conceptual bridges

The most direct bridge is **constraint solving over compositional objects**. In HCI, a UI is assembled from widgets subject to spatial, task, device, and user constraints. In assembly theory, an object is assembled from elementary parts subject to joining and reuse constraints. The formal parallel is not identity, but the same questions recur: is admissibility local or global, finite or infinite, exact or approximate, measurable or merely computable?

A second bridge is **global optimality versus local construction**. Cassowary, ORC Layout, SUPPLE, and Bloom all expose versions of the local/global distinction in HCI layout and interface generation. Assembly theory makes the same tension central: local recursive joins generate possible objects, but the assembly index is defined by a global shortest construction path. 

A third bridge is **causal admissibility**. In HCI, a design is not only a feasible artifact but an intervention on user behavior, studied through A/B testing, causal pathway diagrams, and adaptive models. In assembly theory, an object is not only a static structure but evidence of a constrained generative history, with copy number, selection, and directed exploration used to distinguish random from life-like production. ([ScienceDirect][4])

A fourth bridge is **the dispute between physical assembly and description length**. HCI has a pragmatic version of this: the same interface can be judged by implementation feasibility, layout optimality, user performance, or causal effect. Assembly theory has a sharper version: proponents treat assembly index as a physically meaningful constraint on formation history, while critics argue it collapses toward known compression, grammar, or algorithmic-information measures. ([PLOS][8])

## Best candidates for a literature map

I would prioritize these as anchor literatures:

1. **Constraint-based HCI and computational UI generation**: Cassowary, ORC Layout, SUPPLE, Bloom.
2. **Formal / causal HCI**: model checking, task models, causal pathway diagrams, A/B testing, active inference.
3. **Assembly theory proper**: assembly spaces, assembly index, molecular assembly number, directed/random assembly.
4. **Chemical reaction network theory**: deterministic/stochastic CRNs, local/global detailed balance, origin-of-life dynamics.
5. **Algorithmic and categorical bridges**: compression/grammar critiques of assembly theory, categorical HCI, open reaction networks, differentiable CRNs.

The tightest synthesis is: **HCI studies admissible interaction artifacts; assembly theory studies admissible construction histories. Both can be recast as constrained compositional systems whose admissibility changes when one moves between computable, measurable, continuous, finite, infinite, local, global, randomized, deterministic, causal, differentiable, and categorical semantics.**

[1]: https://iis.seas.harvard.edu/papers/gajos10supple-aij.pdf "Automatically Generating Personalized User Interfaces with SUPPLE"
[2]: https://link.springer.com/rwe/10.1007/978-3-319-27648-9_120-1 "Formal Approaches for Interactive Systems | Springer Nature Link"
[3]: https://www.yorku.ca/mack/mackenzie_chapter.html " 
Motor Behaviour Models for Human-Computer Interaction 
"
[4]: https://www.sciencedirect.com/science/article/pii/S0164121224000542 "A/B testing: A systematic literature review - ScienceDirect"
[5]: https://dl.acm.org/doi/10.5555/2578048.2578114?utm_source=chatgpt.com "A category theory approach to HCI | Proceedings of the ..."
[6]: https://www.nature.com/articles/s41586-023-06600-9 "Assembly theory explains and quantifies selection and evolution | Nature"
[7]: https://www.nature.com/articles/s41467-021-23258-x "Identifying molecules as biosignatures with assembly theory and mass spectrometry | Nature Communications"
[8]: https://journals.plos.org/complexsystems/article?id=10.1371%2Fjournal.pcsy.0000014 "Assembly Theory is an approximation to algorithmic complexity based on LZ compression that does not explain selection or evolution | PLOS Complex Systems"
[9]: https://arxiv.org/abs/2302.02714 "[2302.02714] Differentiable Programming of Chemical Reaction Networks"
[10]: https://www.nature.com/articles/s44260-025-00049-9 "Assembly theory and its relationship with computational complexity | npj Complexity"
[11]: https://kilthub.cmu.edu/articles/conference_contribution/BLOOM_Simplifying_Interactive_Diagram_Development_with_Optimization_Constraints/29086877/1/files/54600533.pdf "Bloom: Simplifying Interactive Diagram Development with Optimization Constraints"
[12]: https://yuejiang-nj.github.io/Publications/2019CHI_ORCLayout/paper.pdf "ORC Layout: Adaptive GUI Layout with OR-Constraints"
[13]: https://faculty.washington.edu/garyhs/docs/zhong-CHI2024-CPD.pdf "AI-Assisted Causal Pathway Diagram for Human-Centered Design"
[14]: https://www.mdpi.com/2673-6918/3/2/24 "Category Theory in Chemistry"
`,
              },
              mode: "live",
              markdown: gfmMarkdownOptions(),
              onChange(event) {
                console.debug(
                  "markdown changed",
                  event.document.id,
                  event.value.length,
                );
              },
            }),
          },
        ],
      },
    ],
  }),
  root,
);
