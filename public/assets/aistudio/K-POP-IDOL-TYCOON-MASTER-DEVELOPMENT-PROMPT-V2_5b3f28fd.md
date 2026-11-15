# K-POP IDOL TYCOON --- MASTER DEVELOPMENT PROMPT V2

**For Google AI Studio**\
**Project status:** New, clean implementation\
**Primary references to attach alongside this prompt:** 1.
`Overall-aesthetic.jpg` --- visual identity and styling reference. 2.
`k-pop-idol-tycoon-design-and-layout.pdf` --- screen-by-screen layout
and composition reference.

------------------------------------------------------------------------

## 0. ROLE, MISSION, AND NON-NEGOTIABLE EXPECTATION

You are acting as a senior React/TypeScript game engineer,
simulation-systems designer, UI/UX designer, and QA engineer.

Build **K-pop Idol Tycoon**, a fully playable, text-based K-pop
entertainment-company management simulator. This must be a real game
with connected mechanics, persistent progression, meaningful decisions,
and a polished interface---not a static mockup, landing page, decorative
dashboard, or collection of disconnected screens.

The player creates an entertainment company and develops it from a small
local agency into a worldwide entertainment company. The player manages
company finances, reputation, upgrades, auditions, idol recruitment,
training, contracts, groups, solo artists, production, clothing,
schedules, concerts, tours, fanbases, and company operations.

### 0.1 Start from a genuinely clean project

This is a **new implementation from scratch**.

-   Do not remix, copy, inherit, or adapt the UI, components, layout,
    styling, navigation, or application structure of the previous BL
    Production Tycoon project.
-   Do not assume that old project components or old screen
    implementations are suitable.
-   Treat this prompt as the game-systems specification.
-   Treat the attached PDF as the authoritative screen-layout reference.
-   Treat `Overall-aesthetic.jpg` as the authoritative overall
    visual-style reference.
-   Build a fresh, coherent application architecture that implements
    these references.
-   Do not bring unrelated content, branding, characters, terminology,
    or mechanics from the old project into K-pop Idol Tycoon.
-   If Google AI Studio starts with a generated starter project, inspect
    it and replace starter/demo content as needed. Do not let starter
    templates dictate the design.

### 0.2 How to interpret the references

The two visual references have different jobs:

**`Overall-aesthetic.jpg` --- visual language**

Use it to guide the overall visual identity: Clean white typography, restrained gradients, compact
information density, strong sidebar navigation, and a polished
game-dashboard feel. The sample's unrelated game content, branding,
account details, and labels are not part of K-pop Idol Tycoon and must
not be copied.

**`k-pop-idol-tycoon-design-and-layout.pdf` --- game visual color and page composition**

Follow the color theme and intended screen compositions in the PDF. In particular,
preserve the top company/resource/date banner, left navigation,
dashboard information panel, production form, seven-day schedule, split
concert/tour layout, three-panel audition layout, three-column company
layout, actual idol profile modal, training facility blocks, and Agency
HQ upgrade blocks.

Do not use one reference to erase the purpose of the other. Apply the
purple visual language to the specific layouts shown in the PDF.

### 0.3 Implementation priority

When trade-offs arise, prioritize in this order:

1.  Correct and stable game logic.
2.  Correct screen structure and interaction behavior.
3.  Persistent, consistent game state.
4.  Clear, usable interface.
5.  Visual polish and decorative details.

Do not sacrifice layout accuracy or functionality for visual decoration.

------------------------------------------------------------------------

# PART I --- GAME IDENTITY AND STARTING PROGRESSION

## 1. Project overview

-   **Title:** K-pop Idol Tycoon
-   **Genre:** Idol management simulation, entertainment-company
    management, text-based simulation, business management, progression
    and resource management.
-   **Platform:** Desktop-first responsive web application.
-   **Technology:** React, preferably TypeScript, HTML, and CSS.
-   **Deployment target:** GitHub Pages.
-   **Runtime:** Fully offline after the application and its local
    assets have loaded.
-   **Backend:** None.
-   **Authentication:** None.
-   **External AI services:** None.
-   **Online gameplay dependencies:** None.
-   **Persistence:** Local browser saves.
-   **Content:** Procedurally generated idols, audition candidates,
    news, events, and other game content.

Do not add selectable difficulty settings. The game should become more
challenging naturally as the company expands.

## 2. New company creation

The player begins by creating an entertainment company.

Required: - Company name. - CEO name.

Optional: - Company logo style. - Company description.

Provide a concise company-creation screen using the same visual language
as the rest of the game. The player should not select a difficulty.

## 3. Original starting progression --- preserve exactly

**Keep the original starting resources and progression. Do not
rebalance, replace, or reinterpret these starting values.**

  Starting item                   Exact value
  ---------------------------- --------------
  Money                          ₩100,000,000
  Rubies                                  100
  Company tier                              F
  Company reputation                    Local
  Groups                                    0
  Solo artists                              0
  Company trainees                          0
  Starting audition capacity     2 candidates

The company begins with limited facilities and opportunities. The
starting budget should allow early experimentation with auditions,
training, upgrades, and management, but must not be unlimited.

The player starts with no groups, no solo artists, and no trainees. Do
not silently generate a free starting roster.

Provide an optional, non-blocking tutorial explaining: 1. Recruiting
idols. 2. Creating groups. 3. Training idols. 4. Producing albums. 5.
Assigning schedules. 6. Earning money. 7. Upgrading the company. 8.
Advancing the game week.

## 4. Game time and weekly progression

The game uses a weekly calendar. Display: - Current year. - Current
month. - Current week. - Current date. - Current weekday when relevant.

Choose one fixed starting date and use it consistently. Do not make the
date depend on the player's real-world clock.

### 4.1 Next Week

The main progression control is **Next Week**. Clicking it advances the
simulation by seven game days.

Before advancing, allow the player to review the current week's plan and
confirm. If the player cancels, do not advance time.

When confirmed, process Monday through Sunday individually and
chronologically. Do not batch all activities as if they happened
simultaneously at the end of the week.

Each day must process the relevant: - Planned activities. - Activity
rewards and costs. - Stamina consumption. - Fatigue increases and
recovery. - Training. - Popularity and fanbase changes. - Group and solo
activities. - Contracts and loyalty. - Production progress. - Album
sales. - Income and expenses. - Concerts and scheduled events. - Random
events. - News. - Other date-dependent systems.

After all seven days: 1. Complete weekly calculations. 2. Generate a
summary from the actual simulation results. 3. Advance the game date by
seven days. 4. Save the updated state. 5. Present the next week's
planner.

Prevent any activity, reward, sale, or event from being processed twice.
Keep current-week planned activities, completed activities, and
next-week plans distinct.

### 4.2 Weekly planner

The planner has seven days: - Monday - Tuesday - Wednesday - Thursday -
Friday - Saturday - Sunday

Each day can contain multiple planned activities. **There is no fixed
limit of four activities per day.** Do not impose a four-slot-per-day
rule.

The player must manually plan activities. Do not automatically assign
activities to idols or automatically copy every activity from the
previous week.

The player can: - Add an activity to a selected day. - Edit an
activity. - Remove an activity. - Assign an activity to an individual
idol. - Assign an activity to an entire group. - Assign an activity to a
solo artist. - Assign company-related activities. - Inspect the complete
weekly plan before advancing. - Optionally use a recurring activity or
copy-plan feature, only when explicitly selected by the player.

Every assignment must validate: - Idol/group/solo availability. -
Stamina. - Fatigue. - Activity requirements. - Production commitments. -
Concert commitments. - Contract status. - Conflicting activities and
other relevant restrictions.

The schedule UI must make the day, activity type, assigned participants,
estimated income where applicable, stamina requirements, fatigue impact,
and activity status understandable.

------------------------------------------------------------------------

# PART II --- ECONOMY AND COMPANY PROGRESSION

## 5. Currencies

There are two primary currencies.

### 5.1 Money

Currency: Korean won (₩). Display formatted amounts such as
`₩100,000,000`; avoid unnecessary decimal places.

Money can be earned through: - Album, EP, and single sales. - Concerts
and tours. - Group schedules. - Solo schedules. - Company events. -
Advertisements and sponsorships. - Fanmeetings. - Other suitable
entertainment activities. - Revenue-generating company upgrades where
applicable.

Money is spent on: - Auditions and recruitment. - Training. - Company
upgrades. - Album production. - Writers and producers. - Clothing and
other shop items. - Marketing. - Concert preparation and venue rental. -
Idol salaries and contract payments. - Other operational expenses.

### 5.2 Rubies

Rubies are the premium in-game currency. They can be earned through
gameplay, rare events, special opportunities, and future expansion
rewards. They can be spent on premium auditions, high-tier clothing,
special recruitment, and premium company upgrades.

-   Do not implement real-money purchases.
-   Rubies must remain obtainable through gameplay.
-   Never require an actual payment.

All currency changes must be recorded and reflected immediately in the
UI.

## 6. Company tier

Company tiers are:

`F, D, C, B, A, S, P`

Optional modifiers may be displayed:

`F+, D+, C+, B+, A+, S+, P+`

Company tier must be calculated from a combination of: - Company
reputation. - Financial performance. - Group popularity. - Solo artist
popularity. - Idol development. - Album sales. - Concert performance. -
Company facilities. - Successful activities and milestones.

Do not base company tier on money alone. Use a weighted, configurable
company rating/progression score. Reaching S or P must require a
combination of meaningful achievements; repeating one profitable action
must not be enough.

Progression milestones can include: - Establishing company operations. -
Recruiting idols. - Forming groups. - Debuting artists. - Releasing
albums. - Developing fanbases. - Reaching revenue milestones. -
Expanding facilities. - Performing concerts. - Building international
recognition.

Tier modifiers must be consistent and must not obscure the actual tier
calculation.

## 7. Company reputation

Reputation levels, in progression order:

1.  Local
2.  Regional
3.  National
4.  International
5.  Global
6.  Worldwide

Reputation is milestone-based. It should increase through meaningful
company achievements, not simply because the company has accumulated
money.

Examples of progression: - **Local:** beginning operations, recruiting
idols, establishing a local fanbase. - **Regional:** successful debut,
consistent regional popularity, successful local events. - **National:**
national popularity, successful albums, major domestic events. -
**International:** international fanbase and successful overseas
activities. - **Global:** strong international recognition, global
fanbase, successful international concerts. - **Worldwide:** exceptional
company progression and high-level achievements across multiple systems.

Keep thresholds configurable. Significant negative events can reduce
reputation, including company dismissals, poor management, financial
problems, failed activities, and other serious events. Penalties should
be proportional and should not punish ordinary mistakes excessively.

## 8. Company upgrades and Agency HQ

Implement a meaningful upgrade tree with branches such as:

-   Headquarters.
-   Training.
-   Auditions.
-   Production.
-   Marketing.
-   Management.

Every upgrade must define: - Name. - Description. - Cost. -
Prerequisites. - Tier requirement, if applicable. - Reputation
requirement, if applicable. - Actual gameplay effect. - Unlock/purchase
status.

Upgrades can cost money or rubies. They must unlock functionality or
improve actual systems---not merely alter decorative values.

### 8.1 Group slots

The company has limited group capacity at the start. The maximum group
capacity is five groups. Additional group slots require appropriate
upgrades. Do not give the player all five slots at the beginning.

### 8.2 Training unlocks

Main Training is available from the beginning. Main 2 and Main 3
training categories require company progression and appropriate
upgrades. The player must not have access to every training category at
the start.

### 8.3 Agency HQ screen

The Agency HQ screen should organize upgrade areas into clear
blocks/cards, following the PDF: - Headquarters. - Training. -
Audition. - Production. - Other upgrade branches.

Show locked, available, purchased, and upgradeable states clearly. Each
purchase must validate prerequisites and resources, deduct the correct
cost, apply its effect, update the UI, and save.

------------------------------------------------------------------------

# PART III --- IDOLS, RECRUITMENT, AND COMPANY MEMBERSHIP

## 9. Idol data model

Idols are the central gameplay units. Every idol needs a unique ID and a
complete, persistent profile.

Each idol should contain: - Unique ID. - Name. - Stage name
(editable). - Gender. - Age. - Nationality. - Personality. -
Potential. - Visual rating. - Popularity. - Fanbase. - Loyalty. -
Contract information. - Idol tier. - Specialty. - Training history. -
Group membership, if any. - Solo artist status, if any. - Fatigue. -
Stamina. - Skill stats. - Assigned portrait filename.

An idol's identity and data must remain consistent when moving between
trainee, group, or solo management states.

## 10. Idol specialties

Every idol has one or more specialties, for example: - Vocal
specialist. - Dance specialist. - Rap specialist. - All-rounder. -
Composer. - Performer. - Entertainer.

Specialties influence weighted overall rating and training
effectiveness. Keep specialty bonuses modest, configurable, and
transparent.

## 11. Idol stats and tiers

All skill stats use a 0--100 range.

### Main stats

-   Vocal.
-   Dance.
-   Rap.
-   Stamina.

### Additional stats

-   Musical.
-   Language.
-   Acting.
-   Fitness.
-   Composition.
-   Writing.
-   Choreography.
-   Entertainment.

### Other attributes

-   Visual.
-   Popularity.
-   Potential.
-   Loyalty.
-   Fatigue.

Do not confuse skill stats with popularity, loyalty, visual rating, or
potential. Popularity and loyalty are separate systems.

### 11.1 Exact idol tier thresholds

These ranges are mandatory:

  Tier     Overall rating
  ------ ----------------
  F                  0--9
  D                10--19
  C                20--39
  B                40--69
  A                70--87
  S                88--94
  P               95--100

Do not replace these with equal-sized intervals.

### 11.2 Weighted overall rating

Calculate overall rating using a weighted average of relevant skill
stats. Specialty affects the weights.

Examples: - Vocal specialist: Vocal is the strongest weight; Musical is
secondary; Language, Entertainment, and other relevant skills contribute
smaller weights. - Dance specialist: Dance is the strongest weight;
Fitness and Choreography are secondary. - Rap specialist: Rap is the
strongest weight; Writing and Entertainment are secondary. -
All-rounder: uses a balanced combination of relevant skills.

Keep weights configurable and calculations transparent. A single
exceptionally high stat must not automatically produce a high overall
tier. Do not assign or increase tiers arbitrarily during recruitment or
training. Tier changes only when the calculated overall rating crosses a
defined threshold.

## 12. Idol potential and personality

Potential represents long-term development ability. It influences
maximum skill growth, training efficiency, chance of significant
improvement, and long-term progression.

-   Generate potential during auditions.
-   Higher potential should be uncommon.
-   High potential does not guarantee P-tier.
-   Potential must not bypass stat caps or the tier formula.

Use a simple personality system with modest, configurable effects.
Examples: - **Hardworking:** small training efficiency bonus. -
**Creative:** small songwriting/composition bonus. - **Charismatic:**
small popularity bonus. - **Perfectionist:** small performance quality
bonus, with slightly more fatigue under demanding schedules. - **Shy:**
small penalty to certain entertainment activities; can improve through
training.

Do not build an unnecessarily complex personality simulation.

## 13. Idol contracts

Each idol has: - Contract status. - Contract duration. - Contract start
date. - Contract expiration date. - Salary. - Renewal eligibility.

The player can inspect contracts, renew them, terminate them, manage
salary, and view expiration dates.

-   Notify the player before contract expiration.
-   Never make an idol disappear without warning.
-   Distinguish ending a company contract from removing an idol from a
    group.
-   Require clear confirmation before contract termination.
-   When a company contract is terminated, the idol leaves the company.
-   Consequences depend on the reason and the idol's loyalty.

## 14. Auditions and recruitment

Implement two audition systems.

### 14.1 Money auditions

Available by default: - Streets.

Unlocked through company upgrades: - Domestic. - International. -
Global.

Higher-level auditions generally cost more and provide better candidate
pools, but recruitment remains random.

Each audition generates candidates with: - Name. - Gender. - Age. -
Nationality. - Personality. - Specialty. - Potential. - Skill stats. -
Idol tier. - Visual rating. - Recruitment cost.

The player must inspect candidates before recruiting. The player can
recruit or reject each candidate. Rejected candidates must not be
automatically recruited. Recruitment deducts the correct amount of money
and adds the selected candidate to the company's trainee roster.

### 14.2 Audition capacity

-   Starting capacity: exactly 2 candidates.
-   Maximum capacity: 5 candidates.
-   Capacity progression depends on company tier, reputation, and
    upgrades.

### 14.3 Ruby auditions

Ruby auditions require rubies. The player selects: - Idol gender: Male
or Female. - Recruitment duration. - Candidate slots.

Duration and intended candidate tier range:

  Duration   Intended candidate tier range
  ---------- -------------------------------
  1 week     F--D
  3 weeks    D--C
  1 month    C--B
  2 months   A

The highest intended tier for ruby auditions is A. Ruby auditions
improve the probability of higher-tier candidates but never guarantee a
tier. Do not generate S- or P-tier idols directly from ruby auditions.
Longer durations should generally improve the candidate-quality
distribution, while randomness and potential still matter.

## 15. Portrait asset system --- exactly two shared collections

Use one centralized portrait source per gender throughout the entire
game. Do not create separate portrait folders for roster members and
audition/trainee candidates.

Required directories:

-   `female-idol-roster/`
-   `male-idol-roster/`

Required files:

-   Female: `F-Idol-1.jpg` through `F-Idol-40.jpg`.
-   Male: `M-Idol-1.jpg` through `M-Idol-40.jpg`.

Rules: 1. Male characters use only the male collection. 2. Female
characters use only the female collection. 3. Audition candidates,
trainees, roster idols, group members, and solo artists all use these
same two centralized collections. 4. Do not duplicate the portrait
collections into separate roster and agent/trainee directories. 5.
Preserve the original filenames. 6. Do not unnecessarily rename,
compress, regenerate, or modify portrait images. 7. Assign a portrait to
a character when that character is generated or created, then store the
assigned filename in the character's data. 8. Do not randomly reassign a
portrait every time a character is displayed or changes management
category. 9. Preserve an existing character's assigned portrait when
they move from trainee to group, solo artist, or another category. 10.
Use a stable portrait lookup/helper rather than scattering asset paths
throughout components. 11. Verify every portrait path and provide a safe
fallback for a missing image without crashing the screen.

The same assigned portrait must appear in audition results, trainee
cards, company roster, group displays, solo artist displays, and the
idol profile modal.

## 16. Group formation and group management

The player can form boy groups and girl groups from company idols.

-   Maximum number of groups: five, subject to unlocked group slots.
-   Maximum group membership: 10 idols.
-   Additional member capacity may require appropriate upgrades.
-   An idol cannot belong to multiple groups simultaneously.
-   An idol cannot belong to both a boy group and girl group
    simultaneously.
-   Validate gender compatibility and membership restrictions before
    formation.
-   Group creation requires appropriate member selection.

Each group contains: - Unique ID. - Group name. - Group gender. - Group
members. - Group popularity. - Group fanbase. - Group tier. - Debut
date. - Company reputation contribution. - Income distribution. -
Loyalty. - Current production. - Current promotional status.

### 16.1 Group roles

Available roles: - Leader. - Main vocalist. - Lead vocalist. - Main
dancer. - Lead dancer. - Main rapper. - Lead rapper. - Visual. - Center.

Members may hold multiple roles. The player assigns, changes, and
removes roles manually. Display roles in the group profile.

### 16.2 Maknae

Maknae is automatically determined as the youngest member. It is not
manually assigned. If multiple members share the youngest age, use a
consistent tie-breaking rule. Never label an older member as Maknae.

## 17. Solo artists

The player can manage solo artists. Solo artists have their own: -
Popularity. - Fanbase. - Schedules. - Production. - Contracts. -
Income. - Clothing. - Training.

Solo artists use the same management systems where appropriate. They do
not count toward group member capacity.

Do not implement subunits in the initial version.

## 18. Removing idols, cooldowns, and disbandment

### 18.1 Remove from group

Require confirmation. Consequences: - Group loyalty decreases. - Group
popularity may decrease slightly. - Idol returns to trainee status. -
Idol retains stats, potential, personality, training history, and
company contract.

The idol must not disappear from the company or lose progression.

### 18.2 Six-month rejoining cooldown

After removal from a group, the idol receives a six-month cooldown based
on game dates.

During the cooldown: - Cannot join a new group. - Cannot rejoin the
previous group. - Cannot be assigned to another group. - Remains
available as a trainee.

The cooldown persists through save/load. Once six game months have
passed, the idol may join a group again.

### 18.3 Remove from company

This is a permanent action and requires a strong confirmation prompt
explaining the consequences.

Consequences: - Idol leaves the company. - Idol is removed from the
company roster and their group. - Group loyalty decreases
significantly. - Company reputation decreases. - Group popularity may
decrease. - Group performance may be affected. - Idol contract is
terminated.

Do not return the idol to the trainee roster. They are no longer
available for recruitment or management through ordinary gameplay. This
action is not reversible through ordinary gameplay.

### 18.4 Group disbandment

Require confirmation and warn if production, promotion, or future
schedules are active.

Disbandment: - Removes the group. - Releases members from the group. -
Returns eligible idols to trainee status. - Preserves stats, contracts,
and training history. - Applies appropriate loyalty consequences. -
Removes group-specific production. - Cancels future group schedules
where necessary.

Disbandment does not automatically terminate company contracts.

## 19. Loyalty

Use the term **Loyalty**, never "Morale".

Each idol has individual loyalty; groups also have group loyalty. Use a
configurable 0--100 range.

Loyalty is influenced by: - Income distribution. - Contract
management. - Training. - Scheduling. - Fatigue. - Company reputation. -
Group stability. - Member removal. - Company financial problems. -
Successful activities. - Company support.

High loyalty reduces departure risk and improves stability. Low loyalty
increases the risk of departure, instability, and contract problems.

Never make idols leave randomly without warning. Provide notifications
or warning indicators before major departure decisions.

## 20. Company/group income distribution

Each group has an adjustable income split between: - Company. - Group.

The two shares must total exactly 100%. The player can adjust the split
only when the group is not producing an album and is not in an active
album promotion/sales period. Explain clearly when adjustment is
blocked. Changes must not retroactively modify past income.

Group-related income includes album sales, concerts, group schedules,
fanmeetings, and other group activities. Calculate the company and group
shares separately and consistently.

### 20.1 Group receives 70% or more

Potential positive effects: - Improved idol loyalty. - Increased idol
training efficiency. - Better idol stat growth. - Improved group
stability.

The magnitude depends on the percentage.

Potential negative effects: - Company receives less immediate income. -
Cash flow may become difficult. - Operational expenses may become harder
to maintain. - Debt risk may increase if financial problems persist.

Do not automatically create debt merely because the group receives 70%.
Reduced cash flow comes first; debt is only a potential consequence of
sustained financial problems.

### 20.2 Company receives 70% or more

Potential positive effects: - Increased company income. - Improved
company financial growth. - Better company share of group-related
activities.

Potential negative effects: - Idol and group loyalty decrease. -
Dissatisfaction may rise. - Departure probability may increase. -
Company reputation may eventually suffer.

Effects become more severe as the company share rises. A 90% company
share should have stronger consequences than 70%. Never remove idols
instantly; provide warnings.

### 20.3 Retention offers

When an idol considers leaving because of low loyalty, the player may
offer money to retain them. Offers cost money, increase loyalty, and
reduce departure probability. Repeated offers to the same idol become
progressively more expensive based on previous offers, popularity, tier,
loyalty, and company finances. Retention is not a guaranteed permanent
solution and must never be free or unlimited.

------------------------------------------------------------------------

# PART IV --- TRAINING, WELLBEING, AND WARDROBE

## 21. Training system

Training improves idol stats and consumes: - Money. - Stamina. -
Training time. - Schedule capacity.

Training increases fatigue. The player can assign training to individual
idols or groups.

### 21.1 Main Training --- available from the beginning

-   Vocal.
-   Dance.
-   Rap.
-   Stamina.

### 21.2 Main 2 Training --- unlock through progression and upgrades

-   Musical.
-   Language.
-   Acting.
-   Fitness.

### 21.3 Main 3 Training --- unlock through progression and upgrades

-   Composition.
-   Writing.
-   Choreography.
-   Entertainment.

The player must not have access to every category from the beginning.

### 21.4 Training behavior

Training must: - Increase the selected stat. - Consume stamina. -
Increase fatigue. - Cost money. - Respect idol potential. - Respect idol
specialty. - Respect the selected training type. - Allow gradual
progression.

Training must not directly assign a higher tier. Recalculate the
weighted overall rating after stat changes and update tier only if the
correct threshold is crossed.

### 21.5 Training efficiency

Efficiency depends on: - Idol specialty. - Potential. - Company
facilities. - Fatigue. - Loyalty. - Training type.

Use diminishing returns at high stats. Prevent unlimited stat growth
through repetitive training.

### 21.6 Training facilities and Agency HQ progression

Training facilities are purchasable and upgradeable through Agency HQ.

-   Vocal Studio, Rap Studio, and Dance Studio may be purchased early at
    relatively affordable prices.
-   These studios are not automatically owned at game start unless
    explicitly listed as a starting facility in the implemented
    configuration.
-   Other specialized facilities should unlock only after the required
    company tier/rank and progression conditions are met.
-   A facility must have a meaningful effect on the matching training
    category.
-   Upgrading a facility should improve real training efficiency and/or
    training outcomes, not just its displayed level.
-   Facility effects must be configurable and applied centrally by the
    game logic.
-   Clearly show facility ownership, level, benefits, upgrade cost, and
    unlock requirements.
-   Do not make all facilities available immediately.

Do not invent arbitrary unlock tiers without centralizing them in the
progression configuration. Choose a coherent progression curve and keep
it easy to rebalance.

## 22. Fatigue and stamina

Every idol has stamina and fatigue.

-   Stamina determines how much activity an idol can perform.
-   Fatigue represents accumulated exhaustion.
-   Activities consume stamina and increase fatigue.
-   Rest and vacation recover stamina and reduce fatigue.

High fatigue can: - Reduce training efficiency. - Reduce performance
quality. - Increase poor activity outcomes. - Increase the chance of
negative events.

Ordinary fatigue should not be excessively punishing. Provide clear
visual indicators so the player can identify overworked idols.

## 23. Clothing and concept system

Clothing is a permanent wardrobe-unlock system.

-   Clothing items are acquired through the Shop and retained in the
    player's inventory.
-   The player can equip owned clothing to eligible idols or artists.
-   Equipped clothing must persist through save/load.
-   Clothing should have relevant concept compatibility and may
    influence album quality, sales, popularity, or performance when
    appropriate.
-   Do not apply arbitrary bonuses unrelated to the clothing's defined
    properties.
-   Show locked, owned, and equipped states clearly.
-   Do not make an item appear equipped if it has not been purchased or
    assigned.

The Shop should include the PDF's categories: - Clothes. - Food. -
Accessories.

Food and accessories should be implemented only with meaningful, defined
gameplay effects. Do not create decorative shop categories with inert
purchase buttons.

------------------------------------------------------------------------

# PART V --- PRODUCTION, SALES, AND ACTIVITIES

## 24. Album production

Production is a primary gameplay system. The player can produce: -
Single. - EP. - Album.

Each release belongs to a group or solo artist.

### 24.1 Production duration

  Release type   Standard duration
  -------------- -------------------
  Single         1 week
  EP             3 weeks
  Album          1 month

Use four weeks as the initial standard game-month duration. Keep
durations configurable.

### 24.2 Production workflow

The player must: 1. Select a group or solo artist. 2. Select release
type. 3. Enter/select album name. 4. Select genre. 5. Select concept. 6.
Assign songwriter/lyricist. 7. Assign producer. 8. Record songs. 9.
Complete production. 10. Release the album. 11. Begin sales and
promotion.

Display progress, remaining time, costs, staff/artist assignments, and
requirements.

### 24.3 Genres

Initial genres: - Pop. - Dance-pop. - R&B. - Hip-hop. - Electronic. -
Ballad. - Rock.

Genres have different trend compatibility.

### 24.4 Concepts

Initial concepts: - Pure. - Cute. - Chic. - Sexy.

Concept compatibility influences album quality and sales.

### 24.5 Writers and producers

The player can assign company writers, company producers, or idol
members.

Relevant skills: - Writer: Writing and Composition. - Producer:
Composition and Musical.

Hiring external staff costs money where appropriate. Idol participation
provides bonuses based on actual skills. The player must not be forced
to hire external staff for every release.

### 24.6 Recording

Recording: - Consumes stamina. - Consumes schedule capacity. - Increases
production progress. - Contributes to album quality.

Do not allow unlimited recording without stamina consequences.

### 24.7 Album quality

Quality depends on: - Idol skill. - Producer skill. - Writer skill. -
Recording performance. - Genre. - Concept compatibility. - Company
facilities. - Clothing. - Production costs.

Calculate quality consistently from relevant inputs. Do not generate
arbitrary quality unrelated to player decisions.

## 25. Trends

Trends change over time. Each week, generate a small number of trending
genres and concepts.

Examples: - Dance-pop becomes popular. - Cute concepts become popular. -
R&B becomes popular. - Chic concepts become popular.

Trends influence album sales, popularity, fanbase growth, and event
performance. The player can inspect current trends before production.
Trends improve strategic decision-making but never guarantee success.

## 26. Album sales

Each album has a sales period of **10 real-time minutes while the game
is open**. This is an actual timer, not ten game weeks. The player can
continue using other game systems while sales run.

During sales: - Generate sales progress. - Calculate revenue. - Update
popularity. - Update fanbase. - Apply income distribution. - Update
company financial records.

Sales depend on: - Idol/group popularity and tier. - Company reputation
and tier. - Album quality. - Concept. - Genre trends. - Clothing. -
Fanbase. - Marketing. - Production quality.

Keep sales calculations configurable and balanced. Avoid arbitrary,
extreme sales numbers.

Display: - Sales progress. - Current sales. - Estimated revenue. -
Remaining time. - Album quality. - Popularity impact.

At completion, show a sales summary.

### 26.1 Offline progress

Save the sales start timestamp. On return/refresh: 1. Read the last
saved sales timestamp. 2. Calculate elapsed real-world time. 3. Apply
eligible offline progress locally. 4. Complete sales if the 10-minute
duration has elapsed. 5. Update financial records. 6. Save the result.

Use real timestamps, not the game week. Do not require a server. Do not
duplicate offline rewards or sales completion.

## 27. Planned activities

Use the weekly planner described in Section 4. Activities can target: -
Individual idols. - Entire groups. - Solo artists. - Company-related
participants.

Group activities apply to eligible group members. Individual activities
apply only to the selected idol. The player selects the target before
assigning the activity.

Validate availability, stamina, fatigue, commitments, contracts, and
activity requirements. Activities must be processed on their assigned
days.

At the end of the week, report: - Completed activities. - Income. -
Expenses. - Net profit. - Idol training progress. - Idol fatigue. -
Popularity changes. - Fanbase changes. - Loyalty changes. - Album
sales. - Reputation changes. - Important events. - Upcoming activities.

The summary must reflect actual processed activities. Never invent
activity results.

------------------------------------------------------------------------

# PART VI --- CONCERTS, FANBASE, NEWS, AND EVENTS

## 28. Concert system

Concerts are a major progression feature.

Concert types: - Domestic. - International. - Global.

Concerts require minimum popularity and company progression.

### 28.1 Concert preparation

The player selects: - Group or solo artist. - Concert type. - Venue. -
Ticket price. - Marketing budget. - Concert date.

Concerts consume preparation time. Do not let the player instantly
perform a concert without planning.

### 28.2 Concert results

Results depend on: - Popularity. - Fanbase. - Idol stats. - Group
performance. - Company reputation. - Venue capacity. - Ticket price. -
Marketing. - Fatigue.

Concerts generate money, popularity, fanbase growth, and reputation, and
also create fatigue.

### 28.3 Venues

Initial venue sizes: - Small venue. - Medium venue. - Large venue. -
Stadium.

Each venue has capacity, rental cost, minimum popularity requirement,
and concert-type compatibility. Ticket sales cannot exceed venue
capacity.

### 28.4 Concert progression and tours

Domestic concerts unlock first. International concerts require higher
popularity and reputation. Global concerts require significant company
progression.

Tours unlock after a group successfully sells out eligible concerts.
Tours require multiple concert dates, suitable venues, preparation, and
financial investment. Tours provide greater rewards than individual
concerts but also increase fatigue and expenses.

### 28.5 Company concert

Unlock company concerts only when: - Company tier reaches S. - Company
reputation reaches Global.

Company concerts include multiple eligible company groups and solo
artists. They are more expensive and more rewarding than ordinary
concerts. They must involve actual planning and simulation---not a
button that instantly grants money.

## 29. Fanbase

Each idol has individual popularity and fanbase. Groups have group
popularity and fanbase. Solo artists have their own fanbases.

Fanbase influences: - Album sales. - Concert attendance. - Schedule
income. - Popularity. - Event opportunities.

Fanbase growth depends on: - Successful activities. - Album releases. -
Trends. - Concerts. - Marketing. - Popularity. - Company reputation.

Prevent excessive fanbase growth from ordinary activities.

Display: - Total fans. - Weekly growth. - Popularity. - Fan
engagement. - Group or idol ranking.

Keep the initial fanbase model simple, understandable, and configurable.

## 30. News

Implement a lightweight news feed with short generated updates based on
actual game events.

Examples: - A group releases an album. - A group reaches a popularity
milestone. - An idol receives an event opportunity. - A concert sells
out. - A company upgrade is completed. - An idol experiences a negative
event. - A group gains fans. - The company reaches a new reputation
level.

Use predefined templates and procedural text generation. Every item has
a timestamp. The player can review previous news. Limit stored news
items to avoid excessive save growth.

**News must never invent events that did not happen.**

## 31. Random events

Implement a small initial random-event system using predefined
templates.

Positive examples: - A song becomes popular. - An idol receives
unexpected attention. - A company receives a promotional opportunity. -
A group gains additional fans. - A company receives a small financial
opportunity.

Negative examples: - An idol becomes exhausted. - A promotional activity
performs poorly. - The company incurs an unexpected expense. - A group
experiences a minor loyalty problem.

Each event defines: - Name. - Description. - Conditions. -
Probability. - Effects. - Optional player decision.

Events must be configurable and should not occur excessively. Avoid
events that immediately destroy the company. Do not implement complex
scandals or severe negative events in the initial version.

## 32. Statistics and reports

Implement a statistics screen with actual calculated values.

### Company statistics

-   Total money.
-   Total rubies.
-   Total expenses.
-   Total revenue.
-   Company tier.
-   Company reputation.
-   Group count.
-   Solo artist count.
-   Trainee count.
-   Total fanbase.

### Idol statistics

-   Idol tier.
-   Skill stats.
-   Popularity.
-   Loyalty.
-   Fatigue.
-   Stamina.
-   Potential.
-   Contract status.

### Group statistics

-   Group tier.
-   Popularity.
-   Fanbase.
-   Loyalty.
-   Member count.
-   Album history.
-   Concert history.
-   Income distribution.

### Album statistics

-   Album quality.
-   Genre.
-   Concept.
-   Sales.
-   Revenue.
-   Production duration.
-   Promotion status.

### Weekly reports

After each week, show income, expenses, net profit, idol growth, group
growth, fanbase changes, album sales, reputation changes, important
events, and upcoming activities.

Reports must be calculated from actual game state. Do not hardcode
report results.

------------------------------------------------------------------------

# PART VII --- USER INTERFACE AND VISUAL DESIGN

## 33. Visual identity: use the attached aesthetic reference

Use `Overall-aesthetic.jpg` as the overall visual direction. It depicts
a polished purple game portal with a large central workspace, darker
content region, side navigation, rounded cards, bright purple selected
states, white text, and compact information panels.

Translate that visual language into a K-pop entertainment-management
game.

### 33.1 Color and surfaces

Use a coherent purple palette: - Rich purple as the overall
app/background identity. - Deep violet/purple for the main content
workspace. - Slightly lighter purple for sidebars and secondary
panels. - Brighter violet/magenta for active navigation, primary
buttons, progress, and important accents. - White or soft lavender for
primary text. - Muted lavender for secondary text. - Small amounts of
pink or other soft accent colors where they support the game identity.

Use subtle gradients where appropriate, not gradients on every element.
Keep text contrast high.

### 33.2 Typography --- mandatory

Use **Press Start 2P as the overall application font**. This is an
explicit design requirement.

-   Load the font locally or bundle it with the application so the game
    remains offline.
-   Apply it consistently across the application.
-   Do not silently substitute a generic sans-serif as the main font.
-   Because Press Start 2P is pixel-display typography and can be
    difficult to read at small sizes, use sensible font sizes, line
    heights, and spacing. If a secondary readable font is absolutely
    necessary for dense long-form text, keep Press Start 2P as the
    dominant interface font and use the secondary font only sparingly
    for readability. Do not replace the requested overall font.
-   Avoid tiny text. The reference image's small text is not a reason to
    make game controls unreadable.

### 33.3 Shape, borders, and decoration

Use: - Rounded but controlled panel corners. - Subtle borders and
shadows. - Compact, well-spaced cards. - Clear selected/hover/disabled
states. - Pixel-inspired icons and accents where suitable. - Occasional
checkerboard/pixel details as decoration, not as a background that
interferes with reading.

Do not clutter every surface with decoration. Do not use giant
decorative graphics that displace actual management information.

### 33.4 Layout shell

Use a consistent desktop-first application shell: - Left navigation
sidebar. - Main content workspace. - Top company/resource/date
information. - Contextual right-side information area only where it
supports the relevant page design.

The PDF's page-specific layout takes precedence over forcing every page
into an identical arrangement. Some screens need three columns, some two
panels, and some a full-width planner.

Keep navigation stable and make the selected section obvious. On smaller
screens, collapse the sidebar while keeping navigation accessible. Make
tables scrollable or card-based as appropriate. Do not hide essential
functionality on smaller screens.

## 34. Top banner

The top banner must display: 1. Company information: - Company logo. -
Company name. - CEO name. - Company tier. - Company rank/progression. 2.
Currencies: - Money. - Rubies. 3. Game date: - Year. - Month. - Week.

Also provide the **Next Week** progression action in a clear, accessible
location. The top banner should be compact enough to leave room for the
game workspace.

## 35. Navigation and page structure

Follow the navigation categories in the PDF:

1.  Dashboard.
2.  Production.
3.  Schedule.
4.  Concert.
5.  Auditions.
6.  Company:
    -   Group/Solo.
    -   Idols.
    -   Trainees.
7.  Training:
    -   Facilities and training categories.
8.  Shop:
    -   Clothes.
    -   Food.
    -   Accessories.
9.  Agency HQ:
    -   Upgrades.
10. Settings.

The original game specification also requires access to News,
Statistics, Save/Load, and other management information. Include these
as appropriate within the navigation or clearly accessible subpages. Do
not omit these systems just because the PDF's navigation list is more
compact.

## 36. Screen-by-screen layout requirements

### 36.1 Dashboard

The dashboard's main/right content area should show useful, current
information: - News. - Current trends. - Current production. -
Statistics. - Company overview. - Current resources. - Upcoming
schedules. - Group overview. - Idol overview. - Important warnings.

Use compact panels/cards with clear hierarchy. The dashboard is a
management overview, not a decorative landing page. Information must
reflect actual game state.

### 36.2 Production

Follow the PDF's production layout. Provide a clear New Production area
with: - Single / EP / Album selection. - Genre. - Concept. - Producer. -
Lyricist/songwriter. - Artist/group selection. - Album name. - Recording
and production progress.

Keep the production form structured and easy to scan. Show active
productions separately from the creation form where appropriate.

### 36.3 Schedule

Follow the PDF's seven-day schedule layout. The weekly planner should
clearly distinguish Monday through Sunday and show planned activities
for each day.

Do not replace the weekly planner with a generic calendar that hides the
seven-day structure. Multiple activities per day must be supported.
Provide clear add/edit/remove controls and validation feedback.

### 36.4 Concert

Follow the PDF's split layout: - **Panel 1, left:** Concert. - **Panel
2, right:** Tour.

Keep ordinary concert planning/results separate from tour
planning/results. Both must use actual game state and the same visual
language.

### 36.5 Auditions

Follow the PDF's three-panel layout: - **Panel 1, left:** Audition types
and controls. - **Panel 2:** Candidate/Idol 1. - **Panel 3:**
Candidate/Idol 2.

Candidate panels must be expandable/scrollable when necessary. The
initial two-candidate capacity should be reflected in the starting
experience. When upgrades increase candidate capacity, the UI may expand
or scroll without breaking the layout. Make gender and audition
type/duration selection clear.

### 36.6 Company

Follow the PDF's three-column composition: - **Column 1:** Idols. -
**Column 2:** Group / Solo. - **Column 3:** Trainees.

Do not flatten this into a single long list. Keep the three management
categories visually distinct. Each column should show useful compact
cards/lists and allow the player to inspect and manage its members.

### 36.7 Idol profile --- MUST BE A REAL MODAL

The PDF explicitly labels the idol profile as **MODAL VIEW**. This is a
strict interaction requirement.

When the player clicks an idol card, open a true modal dialog overlay
above the current page.

A real modal must: - Appear above the existing screen as an overlay. -
Dim or visually separate the background. - Have its own bounded panel
with a clear header and close control. - Keep the current page visible
behind it. - Support closing with the close button and Escape key. -
Prevent accidental interaction with the page behind it while open. - Be
centered or otherwise deliberately positioned as a dialog, not rendered
as ordinary page content.

**Do not implement the profile as:** - An information section inserted
below the roster. - An expanded card in the page flow. - A new inline
panel that pushes other content down. - A route-like replacement that
loses the intended modal behavior.

The profile modal should display the idol's portrait and relevant
complete information: identity, stats, tier, specialty, potential,
popularity, fanbase, loyalty, stamina, fatigue, personality, contract,
training history, group/solo status, and other relevant details. The
portrait must be sized appropriately within the modal and must not
dominate the entire screen.

This modal requirement is especially important. Verify it in the running
application by clicking an idol card.

### 36.8 Training

Follow the PDF's block/card layout. Each facility/category (for example
Vocal Studio, Rap Studio, Dance Studio) should be represented by a
distinct block/card with its actual unlock, ownership, training, and
upgrade state.

Do not make all training facilities available at the start. Apply the
progression and facility rules in Section 21.

### 36.9 Agency HQ

Follow the PDF's block/card layout for Headquarters, Training, Audition,
Production, and other upgrade branches. Show meaningful costs,
requirements, levels, and effects.

### 36.10 Shop and Settings

Use the same visual language. Shop categories include Clothes, Food, and
Accessories. Settings should expose relevant game options and save/reset
actions. Require confirmation for destructive actions.

## 37. Idol portrait sizing and presentation

Portraits are identity thumbnails/cards, not full-screen decorative
artwork.

-   Use consistent, controlled portrait dimensions across roster,
    trainee, audition, group, solo, and modal contexts.
-   Use a predictable aspect ratio and `object-fit: cover` (or another
    intentional crop rule) so images do not stretch.
-   Keep portraits visually secondary to the management information.
-   Do not display huge portrait images in the main dashboard or roster.
-   Do not let a portrait expand to fill a modal or page.
-   Use smaller thumbnails in dense lists and appropriately sized---but
    still bounded---portraits in the profile modal.
-   Maintain a consistent visual hierarchy and card height.
-   Verify that all 80 portraits load correctly and that no broken image
    icons appear.

Do not solve layout issues by simply enlarging portraits.

## 38. Interaction and usability rules

-   Every visible button, tab, card action, dropdown, selector, and
    interactive control must perform its advertised action.
-   Do not create inert buttons or decorative controls that look
    functional.
-   Provide clear feedback for success, failure, locked content,
    insufficient resources, and invalid actions.
-   Use confirmation dialogs for irreversible or high-impact actions.
-   Keep forms understandable and validate inputs.
-   Preserve current page context when opening/closing a modal.
-   Ensure keyboard interaction for important controls.
-   Avoid unnecessary popups and excessive animation.
-   Use loading/transition states only when they represent actual work.
-   Never display fake statistics or hardcoded success messages for
    systems that are not implemented.

------------------------------------------------------------------------

# PART VIII --- SAVE SYSTEM, ARCHITECTURE, AND DELIVERY

## 39. Save system

Use browser LocalStorage for persistent local saves.

Implement: - Automatic saving. - Manual saving. - Multiple save slots. -
Load game. - Delete save. - Export save. - Import save. - Reset game.

Save data must preserve: - Company information. - Resources. - Company
tier and reputation. - Company upgrades. - Idol roster and all idol
data. - Portrait filename assignments. - Idol stats, personalities,
potential, contracts, and loyalty. - Group information, roles, and
membership. - Solo artists. - Training progress and facility levels. -
Clothing inventory and equipped clothing. - Album production and
sales. - Income distribution. - Schedules and pending activities. -
Concerts and tours. - Fanbase. - News and random events. - Game date. -
Cooldowns. - Offline sales timestamps. - Other data required to restore
the complete game state.

Use a versioned save format, for example `saveVersion: 1`.

Validate imported saves. If invalid, show a clear error and do not
overwrite the current game. Design save migration so future versions can
add fields. Missing optional fields in older saves should receive safe
defaults. Loading an older save must not crash the game.

Autosave after major actions, purchases, recruitment, training, group
formation, production changes, schedule changes, weekly progression, and
sales completion. Autosave must never duplicate rewards.

## 40. React architecture

Use React and preferably TypeScript. Keep the architecture modular. Do
not put all game logic into one component.

Separate: - Game state. - Simulation logic. - UI components. - Data
models. - Save system. - Game configuration. - Utility functions.

Suggested organization (adapt if a better clean architecture is
appropriate):

``` text
src/
  components/
    layout/
    dashboard/
    company/
    idols/
    groups/
    auditions/
    training/
    production/
    schedules/
    concerts/
    wardrobe/
    news/
    statistics/
    save/
  game/
    models/
    state/
    simulation/
    economy/
    progression/
    auditions/
    idols/
    groups/
    production/
    schedules/
    concerts/
    events/
    save/
  data/
    idolNames/
    personalities/
    genres/
    concepts/
    clothing/
    events/
  config/
    gameBalance/
    progression/
  utils/
  App.tsx
```

Create a central game engine responsible for: - Weekly progression. -
Daily simulation. - Weekly planned-activity processing. - Activity
validation. - Financial calculations. - Training. - Production. -
Sales. - Loyalty. - Reputation. - Random events. - Contract
processing. - Save/load.

React components should invoke game actions. Components must not
independently calculate important rewards or mutate game rules.
Centralize important calculations.

Use a consistent centralized state approach (React Context or another
lightweight local approach is acceptable). Avoid unnecessary
state-management dependencies.

Use unique IDs for idols, groups, albums, events, contracts, schedules,
and save slots. Do not use array indexes as permanent identifiers.

## 41. Centralized game configuration

Put balance values in a central configuration rather than scattering
magic numbers throughout components.

Centralize: - Starting money and rubies. - Starting tier and
reputation. - Starting audition capacity. - Idol tier thresholds. -
Weighted overall rating rules. - Training costs and efficiency. -
Training facility prices and effects. - Training unlock requirements. -
Audition costs and candidate distributions. - Production durations and
costs. - Sales duration and calculations. - Income distribution
effects. - Company tier requirements. - Reputation thresholds. - Upgrade
costs and effects. - Concert requirements and venue capacities. - Event
probabilities. - Loyalty thresholds. - Fatigue/stamina values. -
Contract durations and salaries where applicable.

Starting progression must remain exactly as specified in Section 3.

## 42. Offline and GitHub Pages requirements

The application must work as a static frontend build and be compatible
with GitHub Pages.

Do not require: - Backend server. - Database. - Authentication. - API
keys. - Cloud functions. - Server-side rendering. - External AI
services.

Use local assets and avoid remote image URLs. Bundle the Press Start 2P
font locally. Ensure: - Build succeeds. - Asset paths work under a
GitHub Pages subpath. - Refreshing the app does not break navigation. -
The game does not depend on server-side routing. - LocalStorage works
after deployment. - The game remains functional offline after assets are
loaded.

If using Vite, configure the base path appropriately. Provide a README
with installation, development, build, GitHub Pages deployment, and
save-system information.

## 43. Error handling

Handle errors clearly and gracefully, including: - Insufficient money. -
Insufficient rubies. - Insufficient stamina. - Missing company
upgrade. - Maximum group capacity. - Maximum group members. - Invalid
idol assignment. - Active album production. - Active promotion. -
Invalid schedule. - Invalid contract. - Invalid save file. - Missing
portrait asset. - Invalid or unavailable facility.

Use readable notifications. Do not silently fail or crash when the
player performs an invalid action.

Require confirmation for: - Kicking an idol out of a group. - Kicking an
idol out of the company. - Disbanding groups. - Terminating contracts. -
Deleting saves. - Resetting the game. - Other irreversible actions.

## 44. Features explicitly deferred from the initial version

Do not implement these in the initial playable version. Keep the
architecture open to future expansion, but do not create unfinished
placeholder screens:

-   Survival shows.
-   Awards.
-   Achievements.
-   Rival companies.
-   Idol scandals.
-   Dating and relationships.
-   Subunits.
-   Expanded contract mechanics.
-   Expanded personality simulation.
-   More complex random events.
-   Additional concert systems.
-   Advanced company rankings.
-   Special idol recruitment.
-   Other advanced future systems not required by this prompt.

Do not include Awards or Achievements in the initial playable version.

------------------------------------------------------------------------

# PART IX --- PHASED IMPLEMENTATION AND VERIFICATION

## 45. Development process: build in validated stages

Do not attempt to implement every system simultaneously without
validating the foundation. Complete each stage, test it, and preserve
working code before proceeding.

### Stage 1 --- Foundation and visual identity

Implement: - Fresh React project and modular architecture. - Main
application shell. - Purple visual identity based on
`Overall-aesthetic.jpg`. - Press Start 2P font. - Navigation and top
company/resource/date banner. - Company creation. - Exact starting
resources and progression. - Central game state. - Weekly clock. - Next
Week action. - Basic dashboard. - LocalStorage persistence. - Save/load
foundation.

Verify that the application runs, saves, reloads, and displays the
correct starting values.

### Stage 2 --- Idols and auditions

Implement: - Idol data model. - Male and female character generation. -
Centralized portrait directories and stable portrait assignment. - Money
auditions. - Ruby auditions. - Candidate inspection and recruitment. -
Trainee roster. - Idol profile modal. - Idol stats and weighted tier
calculation. - Potential and personality. - Contracts.

Verify gender-to-portrait matching, stable portrait assignments,
candidate recruitment, stat calculations, and true modal behavior.

### Stage 3 --- Company, groups, and solo artists

Implement: - Company three-column screen. - Group formation and
membership. - Group roles. - Automatic Maknae. - Solo artists. -
Loyalty. - Income distribution. - Group member removal. - Company
removal. - Group disbandment. - Six-month cooldown.

Verify membership restrictions, income split totals, cooldown behavior,
and consequences of removals.

### Stage 4 --- Training and facilities

Implement: - Main Training. - Main 2 and Main 3 progression unlocks. -
Training facilities. - Facility purchases and upgrades. - Stat gains. -
Stamina and fatigue. - Recovery and vacation behavior.

Verify actual stat increases, correct weighted tier recalculation,
costs, fatigue, stamina, and facility effects.

### Stage 5 --- Production and sales

Implement: - Single, EP, and Album. - Genre and concept. -
Writer/lyricist and producer assignments. - Recording. - Production
progress. - Trends. - Clothing compatibility. - Album quality. - Release
and promotion. - Ten-minute real-time sales. - Offline sales progress.

Verify production requirements, costs, progress, and that sales rewards
cannot be duplicated.

### Stage 6 --- Planned activities and weekly simulation

Implement: - Seven-day planner. - Multiple activities per day. -
Individual idol activities. - Group activities. - Solo artist
activities. - Company events. - Vacation. - Activity editing/removal. -
Activity validation. - Stamina and fatigue. - Income. - Daily
simulation. - Weekly summaries.

Verify conflicts, assigned-day processing, no arbitrary four-activity
limit, chronological simulation, and no duplicate processing.

### Stage 7 --- Concerts and tours

Implement: - Domestic concerts. - International concerts. - Global
concerts. - Venue selection. - Ticket pricing. - Concert preparation. -
Concert results. - Tours. - Company concert unlock conditions.

Verify requirements, venue capacity, ticket limits, costs, fatigue, and
rewards.

### Stage 8 --- Additional systems and polish

Implement: - Fanbase. - News. - Small random event system. -
Statistics. - Dashboard reports. - Agency HQ upgrades. - Shop categories
and meaningful item effects. - Settings. - Final balancing. - Responsive
behavior. - Error handling.

Verify that all screens reflect actual state and all visible actions
work.

### Stage 9 --- Full QA and deployment

Test the complete game, fix defects, run the production build, and
verify GitHub Pages compatibility.

Do not proceed to advanced systems if foundational systems are broken.

## 46. Required test scenarios

Create and execute a checklist covering at least:

1.  Start a new company.
2.  Confirm ₩100,000,000 starting money.
3.  Confirm 100 starting rubies.
4.  Confirm F company tier and Local reputation.
5.  Confirm zero groups, zero solo artists, and zero trainees.
6.  Confirm two starting audition candidate slots.
7.  Recruit a male idol.
8.  Recruit a female idol.
9.  Confirm male and female portraits come from the correct collections.
10. Confirm a character's portrait remains the same after moving between
    game categories.
11. Confirm all 40 male and all 40 female portrait files are available.
12. Train an idol.
13. Confirm the selected stat increases correctly.
14. Confirm stamina and fatigue update correctly.
15. Confirm training cost is deducted.
16. Confirm idol tier recalculates only from the weighted rating.
17. Form a group.
18. Assign group roles.
19. Confirm Maknae is automatically identified.
20. Adjust income distribution.
21. Confirm distribution totals exactly 100%.
22. Attempt to adjust distribution during production/promotion and
    confirm it is blocked.
23. Remove an idol from a group.
24. Confirm the idol retains stats and company contract.
25. Confirm the six-month cooldown.
26. Confirm the cooldown persists through save/load.
27. Remove an idol from the company.
28. Confirm permanent removal and consequences.
29. Disband a group.
30. Confirm contracts are not automatically terminated by disbandment.
31. Produce a release.
32. Confirm production progress and duration.
33. Release the album and confirm sales begin.
34. Confirm sales last 10 real-time minutes.
35. Confirm the player can use other systems while sales run.
36. Refresh during sales.
37. Confirm offline progress is calculated.
38. Confirm sales rewards are not duplicated.
39. Plan activities across multiple days.
40. Confirm multiple activities can be assigned to one day.
41. Confirm there is no fixed four-activity daily limit.
42. Confirm incompatible activities are prevented.
43. Confirm activities process on their assigned days.
44. Advance one week.
45. Confirm all seven days are simulated chronologically.
46. Confirm completed activities are not processed twice.
47. Confirm the weekly summary reflects actual results.
48. Confirm the next week's planner is available.
49. Purchase a training facility.
50. Upgrade a facility and confirm its real effect.
51. Confirm locked facilities require progression.
52. Plan and perform a concert.
53. Confirm venue capacity limits ticket sales.
54. Complete an eligible concert and verify tour unlock rules.
55. Save the game.
56. Refresh the page.
57. Load the game.
58. Confirm all state, portraits, cooldowns, and pending activities are
    preserved.
59. Export a save.
60. Import a valid save.
61. Reject an invalid save without overwriting the current game.
62. Confirm destructive actions require confirmation.
63. Confirm the idol profile opens as a true overlay modal.
64. Confirm the profile does not render inline below the roster.
65. Confirm portraits are not oversized.
66. Confirm every visible button and control works.
67. Confirm no broken asset references.
68. Run the production build.
69. Deploy to GitHub Pages.
70. Confirm the deployed game works without a backend.

## 47. Global development rules

1.  Build a real playable game, not a static mockup.
2.  Start from a clean K-pop Idol Tycoon implementation.
3.  Do not inherit the previous BL Production Tycoon UI or application
    design.
4.  Use the attached aesthetic image for visual identity.
5.  Use the attached PDF for screen composition and layout.
6.  Use Press Start 2P as the overall app font.
7.  Preserve the exact original starting progression.
8.  Do not create buttons that do nothing.
9.  Do not use placeholder functionality for completed systems.
10. Do not omit major systems described in this prompt.
11. Do not invent unnecessary complexity.
12. Do not add selectable difficulty.
13. Do not add online AI features or external runtime dependencies.
14. Do not implement real-money purchases.
15. Do not implement Awards or Achievements in the initial version.
16. Do not implement subunits in the initial version.
17. Do not return a company-dismissed idol to the trainee roster.
18. Do not bypass the six-month group rejoining cooldown.
19. Do not allow income distribution changes during active production or
    promotion.
20. Do not allow invalid schedule assignments.
21. Do not duplicate album sales or activity rewards.
22. Do not change the specified idol tier thresholds.
23. Use exactly two centralized gender-specific portrait collections.
24. Preserve each character's assigned portrait.
25. Do not make portraits oversized.
26. Implement the idol profile as a real modal overlay.
27. Keep important game calculations centralized.
28. Keep balance values configurable.
29. Save the complete game state consistently.
30. Provide clear player feedback.
31. Ensure offline and GitHub Pages compatibility.
32. Test each stage before moving to the next.
33. Do not claim a system is complete until it has been implemented and
    verified.

## 48. Final deliverable

Create the complete React application and all files required to run it.

The finished game must include: - Company creation and original starting
progression. - Weekly game progression and daily simulation. - Company
economy, tiers, reputation, and upgrades. - Auditions and recruitment. -
Male and female idols with the centralized portrait system. - Idol
profiles, stats, tiers, personalities, potential, and contracts. -
Training, facilities, stamina, and fatigue. - Group and solo artist
management. - Group roles and automatic Maknae. - Idol removal, company
removal, group disbandment, and cooldowns. - Loyalty and income
distribution. - Clothing and shop systems. - Album production, trends,
sales, and offline progress. - Seven-day schedules. - Concerts and
tours. - Fanbase, news, and random events. - Statistics and weekly
reports. - Local save/load, multiple slots, export/import. - Purple
pixel-inspired visual design and Press Start 2P typography. - GitHub
Pages compatibility.

Provide the complete source code and a README. Do not respond with only
an explanation, pseudocode, or a plan. Do not omit files required for
the application to run.

If the implementation is too large to produce in one pass, implement it
in the stages above while preserving the same architecture and all
previously completed work. Do not restart unnecessarily or discard
working systems.

**The priority is a stable, playable, offline K-pop
entertainment-company management simulator with accurate screen layouts,
a consistent visual identity, and interconnected game systems.**
