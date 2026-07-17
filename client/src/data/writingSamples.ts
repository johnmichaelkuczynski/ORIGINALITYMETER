export interface WritingSample {
  id: string;
  name: string;
  content: string;
  category?: string;
}

export const writingSamples: WritingSample[] = [
  // DEFAULT SAMPLE (content-neutral)
  {
    id: "formal-functional-relationships",
    name: "Formal and Functional Relationships",
    content: `There are two broad types of relationships: formal and functional.
Formal relationships hold between descriptions. A description is any statement that can be true or false.
Example of a formal relationship: The description that a shape is a square cannot be true unless the description that it has four equal sides is true. Therefore, a shape's being a square depends on its having four equal sides.

Functional relationships hold between events or conditions. (An event is anything that happens in time.)
Example of a functional relationship: A plant cannot grow without water. Therefore, a plant's growth depends on its receiving water.

The first type is structural, i.e., it holds between statements about features.
The second is operational, i.e., it holds between things in the world as they act or change.

Descriptions as objects of consideration
The objects of evaluation are descriptions. Something is not evaluated unless it is described, and it is not described unless it can be stated. One can notice non-descriptions — sounds, objects, movements — but in the relevant sense one evaluates descriptions of them.

Relationships not known through direct observation
Some relationships are known, not through direct observation, but through reasoning. Such relationships are structural, as opposed to observational. Examples of structural relationships are:

If A, then A or B.

All tools require some form of use.

Nothing can be both moving and perfectly still.

There are no rules without conditions.

1 obviously expresses a relationship; 2–4 do so less obviously, as their meanings are:

2*. A tool's being functional depends on its being usable.
3*. An object's being both moving and still depends on contradictory conditions, which cannot occur together.
4*. The existence of rules depends on the existence of conditions to which they apply.

Structural truth and structural understanding
Structural understanding is always understanding of relationships. Observational understanding can be either direct or indirect; the same is true of structural understanding.`,
    category: "Content-Neutral"
  },
  {
    id: "loser-paradox", 
    name: "The Loser Paradox",
    content: `People who are the bottom of a hierarchy are far less likely to spurn that hierarchy than they are to use it against people who are trying to climb the ranks of that hierarchy. The person who never graduates from college may in some contexts claim that a college degree is worthless, but he is unlikely to act accordingly. When he comes across someone without a college degree who is trying to make something of himself, he is likely to pounce on that person, claiming he is an uncredentialed fraud. Explanation: Losers want others to share their coffin, and if that involves hyper-valuing the very people or institutions that put them in that coffin, then so be it.`,
    category: "Paradoxes"
  },
  {
    id: "rational-belief-structure",
    name: "Rational Belief and Underlying Structure",
    content: `When would it become rational to believe that, next time, you're more likely than not to roll this as opposed to that number—that, for example, you're especially likely to roll a 27? This belief becomes rational when, and only when, you have reason to believe that a 27-roll is favored by the structures involved in the game. And that belief, in its turn, is rational if you know that circumstances at all like the following obtain: *The dice are magnetically attracted to the 27-slot* or *The dice are loaded* or *The table is tilted towards the 27-slot* or *Something about the mechanics of your throwing motion tends to produce 27-rolls.* In all such cases, there is some structural feature of your situation that favors 27-rolls. Rational belief in the likely occurrence of 27-rolls is rational belief in the presence of 27-roll-favoring structures.`,
    category: "Epistemology"
  },
  {
    id: "knowledge-vs-awareness",
    name: "Knowledge vs. Awareness", 
    content: `Knowledge is conceptually articulated awareness. In order for me to know that my shoes are uncomfortably tight, I need to have the concepts shoe, tight, discomfort, etc. I do not need to have these concepts—or, arguably, any concepts—to be aware of the uncomfortable tightness in my shoes. My knowledge of that truth is a conceptualization of my awareness of that state of affairs. Equivalently, there are two kinds of awareness: propositional and objectual. My visual perception of my shoes is objectual awareness of my shoes. My knowledge that my shoes are brown is propositional awareness that my shoes are brown.`,
    category: "Epistemology"
  },
  {
    id: "explanatory-goodness-correctness",
    name: "Explanatory Goodness vs. Correctness",
    content: `For an explanation to be good isn't for it to be correct. Sometimes the right explanations are bad ones. A story will make this clear. I'm on a bus. The bus driver is smiling. A mystery! 'What on Earth does he have to smile about?' I ask myself. His job is so boring, and his life must therefore be such a horror.' But then I remember that, just a minute ago, a disembarking passenger gave him fifty $100 bills as a tip. So I have my explanation: 'he just came into a lot of money.' But suppose that, unbeknownst to me, the bus driver is smiling because he's thinking about his favorite movie. In that case, my explanation is wrong. But it is still a good explanation, much better than, say: 'he's smiling because he's a bus driver.'`,
    category: "Epistemology"
  },
  {
    id: "connectedness-paradox",
    name: "Paradox of Connectedness",
    content: `Communications technology is supposed to connect us but separates us into self-contained, non-interacting units. Solution: Communications technology is not supposed to connect us emotionally. On the contrary, it is supposed to connect us in such a way that we can transact without having to bond emotionally. And that is what it does. It connects us logically while disconnecting us emotionally.`,
    category: "Paradoxes"
  },
  {
    id: "arrows-information-paradox",
    name: "Arrow's Information Paradox",
    content: `If you don't know what it is, you don't buy it. Therefore, you don't buy information unless you know what it is. But if you know what it is, you don't need to buy it. But information is bought. Solution: The obvious solution is that information can be described without being disclosed. I can tell you that I have the so and so's phone number without giving you that number, and the circumstances may give you reason to believe me. But oftentimes it isn't until a given person discloses what he says he knows that he there is any reason to believe him to know it. There are a lot of people who make a living charging others for insights into the market, even they have no such insight, as their customers eventually find out.`,
    category: "Paradoxes"
  },
  {
    id: "soft-communism-education",
    name: "Soft Communism and the Paradox of American Education", 
    content: `The more money that the United States invests in education, the worse American education is. Explanation: In the US, when money is poured into education, it is not to improve education but is rather to provide incompetent people with fake employment as educational administrators or teachers. So with each new wave of educational funding, a bloated, entrenched and incompetent cadre of educational bureaucrats becomes even more bloated, entrenched and incompetent, with predictably adverse effects on student-learning. In the US, when money is poured into public schools, it isn't about improving education. It is about creating straw government jobs at the expense of real private sector jobs.`,
    category: "Paradoxes"
  }
];

// Helper function to get sample by ID
export const getSampleById = (id: string): WritingSample | undefined => {
  return writingSamples.find(sample => sample.id === id);
};