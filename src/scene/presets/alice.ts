import { prepare, layout } from "@chenglou/pretext";
import type { SceneDescription } from "../types";
import { SERIF } from "./fonts";

const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const ALICE_1 = `Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?" So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her. There was nothing so very remarkable in that; nor did Alice think it so very much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!" (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually took a watch out of its waistcoat-pocket, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge. In another moment down went Alice after it, never once considering how in the world she was to get out again. The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.`;

const ALICE_2 = `Either the well was very deep, or she fell very slowly, for she had plenty of time as she went down to look about her and to wonder what was going to happen next. First, she tried to look down and make out what she was coming to, but it was too dark to see anything; then she looked at the sides of the well, and noticed that they were filled with cupboards and book-shelves; here and there she saw maps and pictures hung upon pegs. She took down a jar from one of the shelves as she passed; it was labelled "ORANGE MARMALADE", but to her great disappointment it was empty: she did not like to drop the jar for fear of killing somebody underneath, so managed to put it into one of the cupboards as she fell past it. "Well!" thought Alice to herself, "after such a fall as this, I shall think nothing of tumbling down stairs! How brave they'll all think me at home! Why, I wouldn't say anything about it, even if I fell off the top of the house!" (Which was very likely true.) Down, down, down. Would the fall never come to an end? "I wonder how many miles I've fallen by this time?" she said aloud. "I must be getting somewhere near the centre of the earth. Let me see: that would be four thousand miles down, I think\u2014" (for, you see, Alice had learnt several things of this sort in her lessons in the schoolroom, and though this was not a very good opportunity for showing off her knowledge, as there was no one to listen to her, still it was good practice to say it over) "\u2014yes, that's about the right distance\u2014but then I wonder what Latitude or Longitude I've got to?" (Alice had no idea what Latitude was, or Longitude either, but thought they were nice grand words to say.) Presently she began again. "I wonder if I shall fall right through the earth! How funny it'll seem to come out among the people that walk with their heads downward! The Antipathies, I think\u2014" (she was rather glad there was no one listening, this time, as it didn't sound at all the right word) "\u2014but I shall have to ask them what the name of the country is, you know. Please, Ma'am, is this New Zealand or Australia?" (and she tried to curtsey as she spoke\u2014fancy curtseying as you're falling through the air! Do you think you could manage it?) "And what an ignorant little girl she'll think me for asking! No, it'll never do to ask: perhaps I shall see it written up somewhere."`;

const ALICE_3 = `Down, down, down. There was nothing else to do, so Alice soon began talking again. "Dinah'll miss me very much to-night, I should think!" (Dinah was the cat.) "I hope they'll remember her saucer of milk at tea-time. Dinah my dear! I wish you were down here with me! There are no mice in the air, I'm afraid, but you might catch a bat, and that's very like a mouse, you know. But do cats eat bats, I wonder?" And here Alice began to get rather sleepy, and went on saying to herself, in a dreamy sort of way, "Do cats eat bats? Do cats eat bats?" and sometimes, "Do bats eat cats?" for, you see, as she couldn't answer either question, it didn't much matter which way she put it. She felt that she was dozing off, and had just begun to dream that she was walking hand in hand with Dinah, and saying to her very earnestly, "Now, Dinah, tell me the truth: did you ever eat a bat?" when suddenly, thump! thump! down she came upon a heap of sticks and dry leaves, and the fall was over. Alice was not a bit hurt, and she jumped up on to her feet in a moment: she looked up, but it was all dark overhead; before her was another long passage, and the White Rabbit was still in sight, hurrying down it. There was not a moment to be lost: away went Alice like the wind, and was just in time to hear it say, as it turned a corner, "Oh my ears and whiskers, how late it's getting!" She was close behind it when she turned the corner, but the Rabbit was no longer to be seen: she found herself in a long, low hall, which was lit up by a row of lamps hanging from the roof. There were doors all round the hall, but they were all locked; and when Alice had been all the way down one side and up the other, trying every door, she walked sadly down the middle, wondering how she was ever to get out again.`;

const ALICE_4 = `Suddenly she came upon a little three-legged table, all made of solid glass; there was nothing on it except a tiny golden key, and Alice's first thought was that it might belong to one of the doors of the hall; but, alas! either the locks were too large, or the key was too small, but at any rate it would not open any of them. However, on the second time round, she came upon a low curtain she had not noticed before, and behind it was a little door about fifteen inches high: she tried the little golden key in the lock, and to her great delight it fitted! Alice opened the door and found that it led into a small passage, not much larger than a rat-hole: she knelt down and looked along the passage into the loveliest garden you ever saw. How she longed to get out of that dark hall, and wander about among those beds of bright flowers and those cool fountains, but she could not even get her head through the doorway; "and even if my head would go through," thought poor Alice, "it would be of very little use without my shoulders. Oh, how I wish I could shut up like a telescope! I think I could, if I only knew how to begin." For, you see, so many out-of-the-way things had happened lately, that Alice had begun to think that very few things indeed were really impossible. There seemed to be no use in waiting by the little door, so she went back to the table, half hoping she might find another key on it, or at any rate a book of rules for shutting people up like telescopes: this time she found a little bottle on it, ("which certainly was not here before," said Alice,) and round the neck of the bottle was a paper label, with the words "DRINK ME," beautifully printed on it in large letters. It was all very well to say "Drink me," but the wise little Alice was not going to do that in a hurry. "No, I'll look first," she said, "and see whether it's marked 'poison' or not"; for she had read several nice little histories about children who had got burnt, and eaten up by wild beasts and other unpleasant things, all because they would not remember the simple rules their friends had taught them: such as, that a red-hot poker will burn you if you hold it too long; and that if you cut your finger very deeply with a knife, it usually bleeds; and she had never forgotten that, if you drink much from a bottle marked "poison," it is almost certain to disagree with you, sooner or later. However, this bottle was not marked "poison," so Alice ventured to taste it, and finding it very nice, (it had, in fact, a sort of mixed flavour of cherry-tart, custard, pine-apple, roast turkey, toffee, and hot buttered toast,) she very soon finished it off.`;

const ALICE_5 = `"What a curious feeling!" said Alice; "I must be shutting up like a telescope." And so it was indeed: she was now only ten inches high, and her face brightened up at the thought that she was now the right size for going through the little door into that lovely garden. First, however, she waited for a few minutes to see if she was going to shrink any further: she felt a little nervous about this; "for it might end, you know," said Alice to herself, "in my going out altogether, like a candle. I wonder what I should be like then?" And she tried to fancy what the flame of a candle is like after the candle is blown out, for she could not remember ever having seen such a thing. After a while, finding that nothing more happened, she decided on going into the garden at once; but, alas for poor Alice! when she got to the door, she found she had forgotten the little golden key, and when she went back to the table for it, she found she could not possibly reach it: she could see it quite plainly through the glass, and she tried her best to climb up one of the legs of the table, but it was too slippery; and when she had tired herself out with trying, the poor little thing sat down and cried. "Come, there's no use in crying like that!" said Alice to herself, rather sharply; "I advise you to leave off this minute!" She generally gave herself very good advice, (though she very seldom followed it), and sometimes she scolded herself so severely as to bring tears into her eyes; and once she remembered trying to box her own ears for having cheated herself in a game of croquet she was playing against herself, for this curious child was very fond of pretending to be two people. "But it's no use now," thought poor Alice, "to pretend to be two people! Why, there's hardly enough of me left to make one respectable person!" Soon her eye fell on a little glass box that was lying under the table: she opened it, and found in it a very small cake, on which the words "EAT ME" were beautifully marked in currants. "Well, I'll eat it," said Alice, "and if it makes me grow larger, I can reach the key; and if it makes me grow smaller, I can creep under the door; so either way I'll get into the garden, and I don't care which happens!" She ate a little bit, and said anxiously to herself, "Which way? Which way?", holding her hand on the top of her head to feel which way it was growing, and she was quite surprised to find that she remained the same size: to be sure, this generally happens when one eats cake, but Alice had got so much into the way of expecting nothing but out-of-the-way things to happen, that it seemed quite dull and stupid for life to go on in the common way. So she set to work, and very soon finished off the cake.`;

// ---------------------------------------------------------------------------
// SVG illustrations — Alice in Wonderland
// ---------------------------------------------------------------------------

const WHITE_RABBIT_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="260" height="210" viewBox="0 0 260 210" fill="none">
  <defs>
    <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#C9B59A" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <ellipse cx="130" cy="142" rx="52" ry="38" fill="#F5EDE4"/>
    <circle cx="130" cy="90" r="36" fill="#F5EDE4"/>
    <path d="M108 90 C104 52 100 24 108 12 C114 4 122 10 124 22 C127 42 124 70 122 90" fill="#F5EDE4"/>
    <path d="M112 82 C109 56 108 34 112 22 C114 17 119 19 120 26 C122 42 121 66 119 82" fill="#FFBDD2"/>
    <path d="M142 90 C140 48 142 18 150 4 C156 -6 164 2 164 16 C166 38 160 70 154 90" fill="#F5EDE4"/>
    <path d="M146 80 C144 52 146 28 152 14 C155 8 160 11 160 20 C162 38 158 64 154 80" fill="#FFBDD2"/>
    <path d="M98 124 C96 142 96 160 102 170 L130 172 L158 170 C164 160 164 142 162 124" fill="#5B8DBF" opacity="0.65"/>
    <line x1="130" y1="122" x2="130" y2="172" stroke="#4A7AAB" stroke-width="1.5"/>
    <circle cx="130" cy="134" r="2.5" fill="#F0D060"/>
    <circle cx="130" cy="148" r="2.5" fill="#F0D060"/>
    <circle cx="130" cy="162" r="2.5" fill="#F0D060"/>
    <circle cx="184" cy="138" r="14" fill="#FFF6F0"/>
    <ellipse cx="108" cy="174" rx="16" ry="8" fill="#EDE3D8"/>
    <ellipse cx="152" cy="174" rx="16" ry="8" fill="#EDE3D8"/>
  </g>
  <circle cx="118" cy="86" r="4" fill="#E85070"/>
  <circle cx="118" cy="85" r="1.5" fill="#fff" opacity="0.6"/>
  <circle cx="142" cy="86" r="4" fill="#E85070"/>
  <circle cx="142" cy="85" r="1.5" fill="#fff" opacity="0.6"/>
  <ellipse cx="130" cy="98" rx="4.5" ry="3.5" fill="#FFB0C0"/>
  <path d="M125 102 C122 107 118 110 113 111" stroke="#E09898" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <path d="M135 102 C138 107 142 110 147 111" stroke="#E09898" stroke-width="1.5" stroke-linecap="round" fill="none"/>
  <circle cx="112" cy="96" r="7" fill="#FFD4D4" opacity="0.2"/>
  <circle cx="148" cy="96" r="7" fill="#FFD4D4" opacity="0.2"/>
</svg>
`);

const CHESHIRE_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="280" height="200" viewBox="0 0 280 200" fill="none">
  <defs>
    <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="8" flood-color="#9B6BB5" flood-opacity="0.3"/>
    </filter>
    <filter id="g" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <g filter="url(#s)">
    <ellipse cx="140" cy="108" rx="92" ry="68" fill="#C490E0" opacity="0.15"/>
    <path d="M68 92 C100 87 145 92 185 87 C210 85 228 90 238 94" stroke="#B070D0" stroke-width="6" fill="none" opacity="0.1"/>
    <path d="M58 112 C95 110 140 114 185 110 C215 107 235 112 248 114" stroke="#B070D0" stroke-width="6" fill="none" opacity="0.1"/>
    <g filter="url(#g)">
      <ellipse cx="105" cy="78" rx="15" ry="11" fill="#50C878" opacity="0.65"/>
      <ellipse cx="175" cy="78" rx="15" ry="11" fill="#50C878" opacity="0.65"/>
    </g>
    <ellipse cx="105" cy="80" rx="4.5" ry="7.5" fill="#1A1A2E"/>
    <ellipse cx="175" cy="80" rx="4.5" ry="7.5" fill="#1A1A2E"/>
    <circle cx="103" cy="77" r="1.8" fill="#fff" opacity="0.5"/>
    <circle cx="173" cy="77" r="1.8" fill="#fff" opacity="0.5"/>
    <path d="M62 122 C72 152 108 170 140 170 C172 170 208 152 218 122" stroke="#E8D0F8" stroke-width="3" fill="#FFF0F8" opacity="0.85"/>
    <path d="M80 130 L86 144 L94 130" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
    <path d="M94 130 L102 148 L110 130" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
    <path d="M110 130 L118 152 L126 132" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
    <path d="M126 132 L134 154 L142 132" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
    <path d="M142 132 L150 154 L158 132" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
    <path d="M158 132 L166 152 L174 130" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
    <path d="M174 130 L182 148 L190 130" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
    <path d="M190 130 L198 144 L204 130" fill="#FFF8FC" stroke="#E0C0E8" stroke-width="1"/>
  </g>
</svg>
`);

const TEACUP_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="200" viewBox="0 0 240 200" fill="none">
  <defs>
    <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#C9B090" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <ellipse cx="108" cy="170" rx="78" ry="16" fill="#F0E4D6"/>
    <ellipse cx="108" cy="166" rx="70" ry="12" fill="#FFF8F0"/>
    <path d="M54 90 C50 128 58 156 108 156 C158 156 166 128 162 90Z" fill="#FFF8F0"/>
    <path d="M54 90 C50 128 58 156 108 156 C158 156 166 128 162 90" fill="none" stroke="#E8D4BE" stroke-width="2"/>
    <ellipse cx="108" cy="90" rx="54" ry="12" fill="#FFF8F0" stroke="#E8D4BE" stroke-width="2"/>
    <ellipse cx="108" cy="94" rx="46" ry="8" fill="#D4956A" opacity="0.35"/>
    <path d="M60 112 C78 110 98 112 118 110 C138 108 150 112 160 114" stroke="#6AACC8" stroke-width="3" fill="none" opacity="0.45"/>
    <path d="M62 124 C80 122 100 124 120 122 C140 120 152 124 160 126" stroke="#6AACC8" stroke-width="2" fill="none" opacity="0.3"/>
    <path d="M162 102 C186 100 196 114 194 130 C192 144 182 152 164 148" stroke="#E8D4BE" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M162 102 C182 100 190 112 188 126 C186 138 178 146 164 148" stroke="#FFF8F0" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M88 78 C84 64 90 52 86 40" stroke="#D4C4B0" stroke-width="2" fill="none" opacity="0.25" stroke-linecap="round"/>
    <path d="M108 74 C112 58 106 46 110 32" stroke="#D4C4B0" stroke-width="2" fill="none" opacity="0.2" stroke-linecap="round"/>
    <path d="M128 78 C124 62 130 50 126 38" stroke="#D4C4B0" stroke-width="2" fill="none" opacity="0.15" stroke-linecap="round"/>
  </g>
</svg>
`);

const CAKE_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="180" viewBox="0 0 200 180" fill="none">
  <defs>
    <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#C9A84A" flood-opacity="0.2"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <ellipse cx="100" cy="148" rx="76" ry="14" fill="#E8D4BE"/>
    <rect x="32" y="90" width="136" height="60" rx="8" fill="#F5E6D0"/>
    <rect x="32" y="90" width="136" height="60" rx="8" fill="none" stroke="#E0C8A8" stroke-width="1.5"/>
    <rect x="38" y="60" width="124" height="34" rx="6" fill="#FFF0E0"/>
    <rect x="38" y="60" width="124" height="34" rx="6" fill="none" stroke="#E8D4BE" stroke-width="1.5"/>
    <path d="M32 110 C60 106 80 108 100 106 C120 104 140 108 168 110" stroke="#F5C6CB" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M38 78 C60 75 80 77 100 75 C120 73 140 76 162 78" stroke="#F5C6CB" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="100" cy="60" rx="62" ry="8" fill="#FFF8F0" stroke="#E8D4BE" stroke-width="1"/>
    <circle cx="70" cy="56" r="5" fill="#E85050" opacity="0.7"/>
    <circle cx="100" cy="54" r="5" fill="#E85050" opacity="0.7"/>
    <circle cx="130" cy="56" r="5" fill="#E85050" opacity="0.7"/>
    <rect x="96" y="28" width="8" height="28" rx="2" fill="#F5E0A0"/>
    <ellipse cx="100" cy="24" rx="8" ry="6" fill="#FF9040" opacity="0.7"/>
    <ellipse cx="100" cy="22" rx="4" ry="4" fill="#FFD060" opacity="0.8"/>
  </g>
</svg>
`);

const POCKET_WATCH_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="200" viewBox="0 0 160 200" fill="none">
  <defs>
    <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#C9A84A" flood-opacity="0.25"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <path d="M80 36 C72 22 64 12 54 8" stroke="#D4A840" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="80" cy="40" r="7" fill="#E8C450" stroke="#D4A840" stroke-width="1.5"/>
    <circle cx="80" cy="40" r="3.5" fill="#F0D870"/>
    <circle cx="80" cy="110" r="64" fill="#F0D060"/>
    <circle cx="80" cy="110" r="60" fill="#FFF8E0"/>
    <circle cx="80" cy="110" r="56" fill="#FFFDF4"/>
    <circle cx="80" cy="54" r="2.5" fill="#D4A840"/>
    <circle cx="136" cy="110" r="2.5" fill="#D4A840"/>
    <circle cx="80" cy="166" r="2.5" fill="#D4A840"/>
    <circle cx="24" cy="110" r="2.5" fill="#D4A840"/>
    <circle cx="108" cy="62" r="1.5" fill="#E8C450"/>
    <circle cx="130" cy="82" r="1.5" fill="#E8C450"/>
    <circle cx="130" cy="138" r="1.5" fill="#E8C450"/>
    <circle cx="108" cy="158" r="1.5" fill="#E8C450"/>
    <circle cx="52" cy="158" r="1.5" fill="#E8C450"/>
    <circle cx="30" cy="138" r="1.5" fill="#E8C450"/>
    <circle cx="30" cy="82" r="1.5" fill="#E8C450"/>
    <circle cx="52" cy="62" r="1.5" fill="#E8C450"/>
    <line x1="80" y1="110" x2="64" y2="74" stroke="#D4A840" stroke-width="3" stroke-linecap="round"/>
    <line x1="80" y1="110" x2="114" y2="92" stroke="#D4A840" stroke-width="2" stroke-linecap="round"/>
    <circle cx="80" cy="110" r="3.5" fill="#E8C450"/>
    <ellipse cx="62" cy="88" rx="16" ry="10" fill="#fff" opacity="0.12" transform="rotate(-20 62 88)"/>
  </g>
</svg>
`);

const GOLDEN_KEY_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="220" viewBox="0 0 100 220" fill="none">
  <defs>
    <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#C9A84A" flood-opacity="0.3"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <ellipse cx="50" cy="46" rx="30" ry="34" fill="#F0D060" stroke="#D4A840" stroke-width="2"/>
    <ellipse cx="50" cy="46" rx="16" ry="20" fill="#FFF8E0" stroke="#D4A840" stroke-width="1.5"/>
    <rect x="44" y="78" width="12" height="100" rx="3" fill="#F0D060" stroke="#D4A840" stroke-width="1.5"/>
    <rect x="44" y="174" width="34" height="8" rx="2" fill="#F0D060" stroke="#D4A840" stroke-width="1.5"/>
    <rect x="62" y="164" width="18" height="8" rx="2" fill="#F0D060" stroke="#D4A840" stroke-width="1.5"/>
    <rect x="44" y="190" width="26" height="8" rx="2" fill="#F0D060" stroke="#D4A840" stroke-width="1.5"/>
    <line x1="47" y1="86" x2="47" y2="168" stroke="#FFF8E0" stroke-width="2.5" opacity="0.4" stroke-linecap="round"/>
  </g>
</svg>
`);

const PLAYING_CARD_SVG = svgUri(`
<svg xmlns="http://www.w3.org/2000/svg" width="140" height="196" viewBox="0 0 140 196" fill="none">
  <defs>
    <filter id="s" x="-10%" y="-5%" width="120%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#888" flood-opacity="0.28"/>
    </filter>
  </defs>
  <g filter="url(#s)">
    <rect x="8" y="8" width="124" height="180" rx="10" fill="#FFF8F0" stroke="#E0D0C0" stroke-width="1.5"/>
    <rect x="16" y="16" width="108" height="164" rx="6" fill="none" stroke="#E85050" stroke-width="0.8" opacity="0.3"/>
    <path d="M70 78 C70 64 52 50 40 62 C28 74 40 96 70 118 C100 96 112 74 100 62 C88 50 70 64 70 78Z" fill="#E85050"/>
    <path d="M28 34 C28 30 24 26 20 30 C16 34 20 40 28 46 C36 40 40 34 36 30 C32 26 28 30 28 34Z" fill="#E85050"/>
    <path d="M112 162 C112 158 108 154 104 158 C100 162 104 168 112 174 C120 168 124 162 120 158 C116 154 112 158 112 162Z" fill="#E85050" transform="rotate(180 112 164)"/>
  </g>
</svg>
`);

// ---------------------------------------------------------------------------
// Orbs — 3 smaller, Wonderland-themed
// ---------------------------------------------------------------------------

type OrbDefinition = {
  id: string;
  fx: number;
  fy: number;
  size: number;
  mass: number;
  vx: number;
  vy: number;
  color: [number, number, number];
};

const ORBS: OrbDefinition[] = [
  { id: "orb-1", fx: 0.94, fy: 0.18, size: 90, mass: 0.55, vx: 0.36, vy: 0.28, color: [235, 160, 60] },
  { id: "orb-2", fx: 0.04, fy: 0.48, size: 100, mass: 0.62, vx: -0.3, vy: 0.22, color: [240, 170, 70] },
  { id: "orb-3", fx: 0.94, fy: 0.70, size: 85, mass: 0.5, vx: 0.24, vy: -0.32, color: [230, 150, 50] },
];

function orbGradient(color: [number, number, number]): string {
  const [r, g, b] = color;
  return `radial-gradient(circle at 34% 34%, rgba(${r},${g},${b},0.68), rgba(${r},${g},${b},0.28) 48%, rgba(${r},${g},${b},0.1) 68%, transparent 78%)`;
}

function orbShadow(color: [number, number, number]): string {
  const [r, g, b] = color;
  return `0 14px 34px rgba(${r},${g},${b},0.24), 0 0 42px rgba(${r},${g},${b},0.16)`;
}

// ---------------------------------------------------------------------------
// Scene builder
// ---------------------------------------------------------------------------

export function createAliceScene(vw: number, vh: number): SceneDescription {
  const narrow = vw < 900;
  const gutter = narrow ? 18 : 36;
  const maxContentW = 960;
  const contentW = Math.min(vw - gutter * 2, maxContentW);
  const mx = Math.max(gutter, (vw - contentW) / 2);
  const titleY = narrow ? 40 : 48;
  const titleSize = narrow ? 48 : vw > 1400 ? 84 : 70;
  const titleLineHeight = narrow ? 52 : Math.round(titleSize * 0.96);
  const titleFont = `700 ${titleSize}px ${SERIF}`;
  const titleH = layout(prepare("Alice\u2019s Adventures in Wonderland", titleFont), contentW, titleLineHeight).height + 10;
  const deckY = titleY + titleH + 18;
  const bodyY = deckY + 56;
  const copySize = narrow ? 20 : 23;
  const copyLineHeight = narrow ? 33 : 37;
  const illustrationScale = narrow ? 0.84 : 1;
  const placeX = (fx: number, width: number) => Math.max(mx, Math.min(mx + contentW * fx, mx + contentW - width));

  const splitAt = (text: string, ...markers: string[]): string[] => {
    if (markers.length === 0) return [text];
    const pat = markers.map(m => `(?=${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`).join('|');
    return text.split(new RegExp(pat)).map(s => s.trim()).filter(Boolean);
  };

  const paragraphs = [
    ...splitAt(ALICE_1, 'So she was considering', 'There was nothing so very remarkable', 'In another moment down went', 'The rabbit-hole went straight on'),
    ...splitAt(ALICE_2, '"Well!" thought Alice to herself', 'Down, down, down. Would the fall', 'Presently she began again.'),
    ...splitAt(ALICE_3, 'Alice was not a bit hurt', 'There were doors all round'),
    ...splitAt(ALICE_4, 'Alice opened the door and found', 'There seemed to be no use in waiting', 'It was all very well to say', 'However, this bottle was not marked'),
    ...splitAt(ALICE_5, 'After a while, finding that nothing', '"Come, there\'s no use in crying', 'Soon her eye fell on a little glass', 'She ate a little bit', 'So she set to work'),
  ];

  const SEPARATOR_AFTER = 16;
  const paragraphGap = Math.round(copyLineHeight * 0.45);

  const estimateH = (text: string): number => {
    const cpl = Math.floor(contentW / (copySize * 0.56));
    return Math.ceil(text.length / cpl) * copyLineHeight;
  };

  let totalTextH = 0;
  for (let i = 0; i < paragraphs.length; i++) {
    if (i === SEPARATOR_AFTER + 1) totalTextH += paragraphGap;
    totalTextH += estimateH(paragraphs[i]) + paragraphGap;
  }
  const footerY = bodyY + totalTextH;
  const H = Math.max(vh, footerY + 228);

  const aliceBackdrop =
    "linear-gradient(180deg, #fcf9f5 0%, #f4edf6 38%, #ebe3f0 72%, #faf6fb 100%), radial-gradient(circle at 10% 8%, rgba(218, 178, 65, 0.12) 0%, transparent 26%), radial-gradient(circle at 86% 14%, rgba(88, 152, 212, 0.14) 0%, transparent 28%), radial-gradient(circle at 68% 64%, rgba(196, 138, 224, 0.1) 0%, transparent 30%), radial-gradient(circle at 20% 78%, rgba(210, 95, 105, 0.08) 0%, transparent 26%)";

  const elements: SceneDescription["elements"] = [
    {
      id: "pg-title",
      type: "heading",
      rect: { x: mx, y: titleY, width: contentW, height: titleH },
      throwable: false,
      pinned: true,
      text: "Alice\u2019s Adventures in Wonderland",
      fontSize: titleSize,
      fontWeight: 700,
      fontFamily: SERIF,
      lineHeight: titleLineHeight,
      letterSpacing: "-0.035em",
      color: "#2a1c38",
      minSegmentWidth: 140,
      allowWordBreaks: false,
    },
    {
      id: "pg-deck",
      type: "paragraph",
      rect: { x: mx, y: deckY, width: Math.min(contentW, narrow ? contentW : 860), height: 54 },
      throwable: false,
      pinned: true,
      text: "Chapter I  ·  Down the Rabbit-Hole",
      fontSize: narrow ? 19 : 21,
      fontWeight: 400,
      fontStyle: "italic",
      fontFamily: SERIF,
      lineHeight: narrow ? 28 : 30,
      color: "rgba(48, 34, 60, 0.68)",
      minSegmentWidth: 72,
      allowWordBreaks: false,
    },
  ];

  let textY = bodyY;
  for (let i = 0; i < paragraphs.length; i++) {
    if (i === SEPARATOR_AFTER + 1) {
      textY += paragraphGap;
    }

    const h = estimateH(paragraphs[i]);
    elements.push({
      id: `pg-p-${i}`,
      type: "paragraph",
      rect: { x: mx, y: textY, width: contentW, height: h },
      throwable: false,
      pinned: true,
      text: paragraphs[i],
      fontSize: copySize,
      fontWeight: 400,
      fontFamily: SERIF,
      lineHeight: copyLineHeight,
      color: "#3a2a42",
      minSegmentWidth: 42,
      allowWordBreaks: false,
    });
    textY += h + paragraphGap;
  }

  // ---- Illustrated objects — Alice in Wonderland ----

  const illustrations = [
    {
      id: "white-rabbit",
      imageSrc: WHITE_RABBIT_SVG,
      imageAlt: "The White Rabbit in his waistcoat",
      fx: narrow ? 0.84 : 0.92,
      fy: narrow ? 0.06 : 0.06,
      width: 208 * illustrationScale,
      height: 168 * illustrationScale,
      mass: 1.7,
      polygonPoints: [
        { x: 0.34, y: 0.0 },
        { x: 0.46, y: 0.02 },
        { x: 0.50, y: 0.26 },
        { x: 0.56, y: 0.0 },
        { x: 0.66, y: 0.02 },
        { x: 0.70, y: 0.32 },
        { x: 0.76, y: 0.54 },
        { x: 0.86, y: 0.62 },
        { x: 0.86, y: 0.80 },
        { x: 0.74, y: 0.94 },
        { x: 0.54, y: 0.98 },
        { x: 0.34, y: 0.98 },
        { x: 0.18, y: 0.92 },
        { x: 0.12, y: 0.74 },
        { x: 0.16, y: 0.54 },
        { x: 0.24, y: 0.32 },
      ],
    },
    {
      id: "cheshire",
      imageSrc: CHESHIRE_SVG,
      imageAlt: "The Cheshire Cat's grin",
      fx: narrow ? 0.12 : 0.06,
      fy: narrow ? 0.36 : 0.34,
      width: 240 * illustrationScale,
      height: 170 * illustrationScale,
      mass: 1.4,
      polygonPoints: [
        { x: 0.18, y: 0.22 },
        { x: 0.38, y: 0.18 },
        { x: 0.62, y: 0.18 },
        { x: 0.82, y: 0.22 },
        { x: 0.94, y: 0.42 },
        { x: 0.90, y: 0.78 },
        { x: 0.72, y: 0.92 },
        { x: 0.50, y: 0.96 },
        { x: 0.28, y: 0.92 },
        { x: 0.10, y: 0.78 },
        { x: 0.06, y: 0.42 },
      ],
    },
    {
      id: "teacup",
      imageSrc: TEACUP_SVG,
      imageAlt: "A teacup from the Mad Tea-Party",
      fx: narrow ? 0.84 : 0.92,
      fy: narrow ? 0.58 : 0.56,
      width: 200 * illustrationScale,
      height: 166 * illustrationScale,
      mass: 1.5,
      polygonPoints: [
        { x: 0.12, y: 0.28 },
        { x: 0.34, y: 0.18 },
        { x: 0.66, y: 0.18 },
        { x: 0.82, y: 0.28 },
        { x: 0.92, y: 0.42 },
        { x: 0.88, y: 0.68 },
        { x: 0.80, y: 0.82 },
        { x: 0.56, y: 0.92 },
        { x: 0.28, y: 0.92 },
        { x: 0.10, y: 0.82 },
        { x: 0.06, y: 0.58 },
      ],
    },
    {
      id: "cake",
      imageSrc: CAKE_SVG,
      imageAlt: "The EAT ME cake",
      fx: narrow ? 0.14 : 0.06,
      fy: narrow ? 0.82 : 0.80,
      width: 160 * illustrationScale,
      height: 144 * illustrationScale,
      mass: 1.4,
      polygonPoints: [
        { x: 0.10, y: 0.18 },
        { x: 0.88, y: 0.18 },
        { x: 0.92, y: 0.42 },
        { x: 0.94, y: 0.82 },
        { x: 0.86, y: 0.96 },
        { x: 0.14, y: 0.96 },
        { x: 0.06, y: 0.82 },
        { x: 0.08, y: 0.42 },
      ],
    },
  ];

  for (const c of illustrations) {
    elements.push({
      id: `pg-${c.id}`,
      type: "image",
      rect: {
        x: mx + contentW * c.fx - c.width / 2,
        y: H * c.fy - c.height / 2,
        width: c.width,
        height: c.height,
      },
      throwable: true,
      pinned: false,
      backgroundColor: "transparent",
      borderRadius: 0,
      imageSrc: c.imageSrc,
      imageAlt: c.imageAlt,
      physicsShape: "polygon",
      polygonPoints: c.polygonPoints,
      mass: c.mass,
      lockRotation: true,
      frictionAir: 0.02,
      restitution: 0.78,
    });
  }

  // ---- Smaller throwable items ----

  const items = [
    {
      id: "pg-watch",
      imageSrc: POCKET_WATCH_SVG,
      imageAlt: "The White Rabbit's pocket watch",
      rect: {
        x: placeX(narrow ? 0.10 : 0.04, narrow ? 100 : 120),
        y: bodyY + totalTextH * 0.20,
        width: (narrow ? 100 : 120) * illustrationScale,
        height: (narrow ? 125 : 150) * illustrationScale,
      },
      mass: 1.0,
    },
    {
      id: "pg-key",
      imageSrc: GOLDEN_KEY_SVG,
      imageAlt: "The tiny golden key",
      rect: {
        x: placeX(narrow ? 0.86 : 0.94, narrow ? 60 : 72),
        y: bodyY + totalTextH * 0.42,
        width: (narrow ? 60 : 72) * illustrationScale,
        height: (narrow ? 132 : 158) * illustrationScale,
      },
      mass: 0.7,
    },
    {
      id: "pg-card",
      imageSrc: PLAYING_CARD_SVG,
      imageAlt: "A playing card from the Queen's court",
      rect: {
        x: placeX(narrow ? 0.12 : 0.06, narrow ? 90 : 106),
        y: bodyY + totalTextH * 0.66,
        width: (narrow ? 90 : 106) * illustrationScale,
        height: (narrow ? 126 : 148) * illustrationScale,
      },
      mass: 0.6,
    },
  ];

  for (const item of items) {
    elements.push({
      id: item.id,
      type: "image",
      rect: item.rect,
      throwable: true,
      pinned: false,
      backgroundColor: "transparent",
      imageSrc: item.imageSrc,
      imageAlt: item.imageAlt,
      mass: item.mass,
      frictionAir: 0.02,
      restitution: 0.8,
    });
  }

  // ---- Floating orbs ----

  const orbScale = narrow ? 0.8 : 1;
  for (const orb of ORBS) {
    const size = orb.size * orbScale;
    elements.push({
      id: `pg-orb-${orb.id}`,
      type: "badge",
      rect: {
        x: mx + contentW * orb.fx - size / 2,
        y: H * orb.fy - size / 2,
        width: size,
        height: size,
      },
      throwable: true,
      pinned: false,
      text: "",
      fontSize: 1,
      fontWeight: 400,
      fontFamily: SERIF,
      color: "transparent",
      backgroundColor: orbGradient(orb.color),
      borderRadius: size / 2,
      boxShadow: orbShadow(orb.color),
      mass: orb.mass,
      physicsShape: "circle",
      initialVelocityX: orb.vx,
      initialVelocityY: orb.vy,
      friction: 0,
      frictionAir: 0.002,
      restitution: 0.96,
    });
  }


  return {
    id: "alice",
    name: "Alice",
    width: vw,
    height: H,
    backgroundColor: aliceBackdrop,
    elements,
  };
}
