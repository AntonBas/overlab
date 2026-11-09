# Аудит героїв (листопад 2026)

Джерела: офіційні сторінки героїв `overwatch.blizzard.com` (перки, здібності), Overwatch Wiki `overwatch.weirdgloop.org` (числа, матчапи, синергії, історія балансу), офіційні патчноути (Season 5, 6 жовтня; mid-season 3 листопада; хотфікс 5 листопада 2026) та пошук по новинах. Дані проєкту — локальна БД (54 героя, 216 перків, 201 зв'язок герой-герой, 57 категорійних зв'язків).

Позначки: **(wiki)** — є пряма підстава на вікі; **(перехресно)** — підтверджується сторінкою іншого героя; **(?)** — слабка або суперечлива підстава, потрібне твоє рішення. Нічого в коді, БД чи міграціях не змінювалось.

## Статус виправлень

Міграція `V27__hero_audit_fixes.sql`: 3 застарілі перки (D.Mon, Winston, Echo), тексти Emre, Shion, Symmetra, Widowmaker, Moira, рід Doctrine/Lifeweaver/D.Mon у нотатках, видалено 15 хибних зв'язків, додано 8 перевернутих, прибрано `long-range` та WEAK vs `dive` у Emre, додано `hitscan` Shion. `imported_description` перків не чіпається, щоб імпорт від Blizzard не затирав правки.

Напряму в БД (без міграцій): додано 204 контри та 132 синергії, Doctrine прибрано з `projectile`. Кожен герой тепер має хоча б один зв'язок; взаємних контр немає.

Не чіпано (чекає рішення): Zarya→Genji, Ana↔Roadhog, Pharah↔Roadhog, Moira↔Lucio, Mauga↔Jetpack Cat, Winston/Ball у `fast-targets`, Brigitte/Winston, Ana/Anran, Orisa/Winston, Hanzo WEAK vs `flying`, Venture «her/they», Cost of Life, склад категорій (розділ 2.5). Без вихідних контр лишились Freja, Lifeweaver, Shion, Wuyang, Jetpack Cat, Lucio.

## 1. Підсумок

| Що перевірено | Результат |
| --- | --- |
| Склад героїв | 54 = 15 танків + 23 дамаг + 16 саппортів, збігається з грою (Doctrine — 54-й, 6 жовтня 2026). Відсутніх і зайвих немає |
| Перки (назви, слот, мажор/мінор) | 216 з 216 збігаються з Blizzard |
| Тексти перків | Збігаються, крім 3 застарілих після патчу 3 листопада і 1 вимкненого перка |
| Ролі й підролі | Збігаються (Sombra вже Support/Tactician після Season 5) |
| Зв'язки герой-герой | Прямих протиріч у самій БД немає, симетрія забезпечена структурою (один рядок = «контрить» + «контрований»). Є 20+ зв'язків, що суперечать вікі, і дуже багато пропущених |
| Зв'язки герой-категорія | 11 логічних конфліктів між категоріями та зв'язками героїв (розділ 2.3) |
| Тексти сильних/слабких сторін | Знайдено фактичні помилки в 8 героях (розділ 2.2) |

## 2. Глобальні проблеми

### 2.1 Застарілі описи перків (патч 3 листопада; офіційні сторінки Blizzard ще показують старі числа)

| Герой | Перк | У БД зараз | Має бути |
| --- | --- | --- | --- |
| D.Mon | Overstrike | lifesteal 150% | **125%** |
| Winston | Revitalizing Barrier | 35 здоров'я/с | **30 здоров'я/с** |
| Echo | Aerial Munitions | «нескінченні набої під час Flight» | ще й **поповнює набої при використанні**; оцінка AVOID варта перегляду (перк підсилили) |
| Doctrine | Cost of Life | AVOID | (wiki) перк **тимчасово вимкнений через баг**; варто це відобразити |

Додатково переглянь оцінки (RECOMMENDED/OPTIONAL/AVOID), бо вони твої, не Blizzard: Emre **Cyber Adhesion = AVOID** при +40 шкоди до 150 сумарно (?); Freja **Relentless Barrage = RECOMMENDED** після нерфа 8→5 набоїв 8 вересня (?).

### 2.2 Фактичні помилки в текстах героїв

| Герой | Що не так |
| --- | --- |
| **Emre** | Сильні сторони описують «poke and peek» і «повільний без Override». Вікі: run-and-gun, сильний на близькій і середній дистанції, зум не сповільнює, falloff 25–40 м. Не згадані пасив прискореного перезаряджання та Altered Vitals. Категорія `long-range` сумнівна |
| **Shion** | У слабких сторонах «survive **him**» (Shion — «вона»). «Execution is slow to charge» — застаріло: це хітскан-залп з кулдауном 5 с, розкид зменшили 3 листопада |
| **Doctrine** | В тексті й нотатках зв'язків скрізь «she/her» («she supports dive tanks», «helps her escape/avoid», «returns her scepter»). Вікі: **he/him**. Eternal Scepter — хітскан, що пробиває (wiki), тому нотатка Genji «returns her Eternal Scepter projectiles» і категорія `projectile` сумнівні |
| **Lifeweaver** | У нотатках Winston і Wrecking Ball «helps **her** get away», у сильних сторонах «him» — єдиний рід має бути he/him |
| **D.Mon** | В описі «He pushes forward», у сильних сторонах «she keeps up». Вікі: **she**. Привести до одного |
| **Symmetra** | Слабка сторона «її основний вогонь заряджається на бар'єрах Ramattra, Sigma, Domina» читається як слабкість, а це сила (атака по бар'єрах **заряджає** промінь). Реальні слабкості (wiki): 125 здоров'я, короткий промінь 12 м, погано проти броні |
| **Widowmaker** | «Takes little damage, so supports can focus on healing others» — неточно (225 HP, жодного зниження шкоди) |
| **Moira** | «Symmetra's turret and primary fire handle her engage» суперечить вікі Moira (Symmetra для неї сприятливий матчап) |

Також: `Venture` в БД «her», на вікі «they» — перевір офіційне звертання, бо я не зміг його підтвердити (?).

### 2.3 Конфлікти «категорія ↔ конкретний герой»

Категорійні зв'язки кажуть одне, а точкові зв'язки героя — протилежне:

| Герой | Категорійний зв'язок | Але в точкових зв'язках | Підстава / що робити |
| --- | --- | --- | --- |
| Widowmaker | STRONG vs `flying` (Echo) | Echo COUNTER Widowmaker | Сторінка Echo: Widowmaker — її найбільша загроза. **Видалити Echo→Widowmaker** |
| Echo | WEAK vs `hitscan` (Widowmaker) | той самий зв'язок | те саме |
| Symmetra | STRONG vs `fast-targets` (Tracer) | Tracer COUNTER Symmetra | Вікі Symmetra: турелі уповільнюють Tracer. **Перевернути: Symmetra→Tracer** |
| Tracer | WEAK vs `beam` (Symmetra) | той самий зв'язок | те саме |
| Tracer | STRONG vs `long-range` (Hanzo) | Hanzo COUNTER Tracer | Вікі Hanzo: матчап змішаний. **Видалити Hanzo→Tracer** |
| Hanzo | WEAK vs `dive` (Tracer) | той самий зв'язок | те саме |
| Winston | STRONG vs `fast-targets` (Wrecking Ball) | Wrecking Ball COUNTER Winston | Вікі Winston: Ball «difficult» (Winston слабкий проти Ball). Прибрати Ball із `fast-targets` або зробити виняток (?) |
| Brigitte | STRONG vs `dive` (Winston) | Winston COUNTER Brigitte | (?) Winston пірнає на Brigitte; вирішити, який напрямок лишити |
| Ana | STRONG vs `self-healing` (Anran) | Anran COUNTER Ana | Вікі Anran: Ana — «good target». Або прибрати Anran із `self-healing`, або змінити зв'язок (?) |
| D.Va | STRONG vs `projectile` (Sigma) | Sigma COUNTER D.Va | Це виправданий виняток (Accretion і Kinetic Grasp), але його треба пояснити в нотатці (?) |
| Orisa | WEAK vs `beam` (Winston) | Orisa COUNTER Winston | (?) У вікі Winston Orisa не згадана; вирішити |

### 2.4 Структурні прогалини

- **Симетрія герой-герой працює автоматично**: один рядок `A COUNTER B` показується як «A контрить B» і «B контрований A». Прямих двосторонніх протиріч (A↔B обидва COUNTER) у БД немає.
- **Категорійні зв'язки односторонні** (за `categoryCoverage.ts`/`RelationTabs.tsx`): «Ana STRONG vs self-healing» ховає Roadhog зі списку Ани, але на сторінці Roadhog «слабкий проти Ани» з'являється лише завдяки окремому рядку `ana COUNTER roadhog`. Для інших членів категорії (Anran, Domina, JQ, Mauga, Reaper) зворотного запису немає. Це потенційна вимога «має відображатись і з протилежного боку».
- **Героїв без жодного вихідного «контрить»:** Baptiste, Freja, Jetpack Cat, Lifeweaver, Reaper, Shion, Sierra, Torbjörn, Wuyang. Дуже мало зв'язків узагалі: Torbjörn (2), Sojourn (2), Sierra (2), Venture (3), Baptiste (3).
- **Нижче в таблицях** — що саме додати. Більшість додавань підтверджена **кількома сторінками** вікі одночасно, тому їх можна додавати без ризику.

### 2.5 Склад категорій: пропозиції

Це ключове для логіки «категорія контрить категорію». Правила, які я використовував: `projectile` — основна зброя або ключова здібність це снаряд (D.Va Defense Matrix його з'їдає); `hitscan` — основна зброя миттєва; `short-range` — вся шкода працює вживу.

| Категорія | Додати | Прибрати / переглянути |
| --- | --- | --- |
| `projectile` | Anran (віяла), Sierra (Helix Rifle — снаряд, швидкість 120), Kiriko (Kunai), Lucio (Sonic Amplifier), Ramattra (Omnic Form), Venture (SMART Excavator), Hazard (Bonespur), Sojourn (Railgun primary — снаряд) | Doctrine (Scepter хітскан); Juno (Mediblaster хітскан, торпеди — снаряди, залишити за ними) (?) |
| `hitscan` | Shion (пістолети й Execution), та, якщо хочеш повноту: Tracer, Reaper, Sombra, Junker Queen, D.Va (мех), Wrecking Ball, Juno (?) | — |
| `short-range` | Tracer (його ж сильні сторони кажуть «only works close»), Doomfist, Winston, Roadhog, Shion (?) | — |
| `long-range` | — | Emre (run-and-gun, 25–40 м), Sojourn (вікі: mid-range) (?) |
| `flying` | Doctrine (Infused Shrouded Momentum = free flight, як у Echo) (?), Mercy (Guardian Angel/Valkyrie) (?) | — |
| `backline-healers` | Baptiste (?) | Illari (є Outburst), Lifeweaver (dash + platform), Wuyang (Torrent), Doctrine (flight) — зараз «little mobility or no way out» їх не описує (?) |
| `self-healing` | Soldier: 76 (Biotic Field/Stim Pack), Moira, Hazard (perk), Lifeweaver (passive 40%) (?) | — |
| `fast-targets` | — | Wrecking Ball vs Winston (див. 2.3) |
| `beam` | — | Doctrine/Illari не beam; ок |

## 3. По героях

Позначення: ✅ перки збігаються з Blizzard; **Хибні** — прибрати/перевернути; **Додати** — пропущені зв'язки; **Синергії** — відсутні.
Усі зв'язки читаються як «X контрить Y».

### Дамаг

**Anran** ✅ Релізи 3 листопада (Zhuque 22→24, Inferno Rush без knockback, Ascent cast 1.2→1.0) у тексті не відображені — перевір опис.
- Хибні: Anran→Illari, Anran→Kiriko (вікі Anran: Illari Pylon знімає горіння, Kiriko Suzu очищає і карає по голові) — **перевернути** на Illari→Anran, Kiriko→Anran.
- Додати: Brigitte→Anran (hard counter), Zarya→Anran (дуже), Roadhog→Anran, D.Mon→Anran, Cassidy→Anran, Echo→Anran, Pharah→Anran, Reaper→Anran, Venture→Anran; Anran→Genji, D.Va, Orisa, Lifeweaver, Mercy, Juno, Jetpack Cat.
- Синергії: Mauga, Zarya, Ashe, Kiriko, Lifeweaver (вікі: «exceptional»).

**Ashe** ✅ Додати: Ashe→Junkrat, Ashe→Brigitte; D.Va→Ashe, Reinhardt→Ashe, Wrecking Ball→Ashe (дуже), Winston→Ashe, Hanzo→Ashe.
- Хибні (?): Mei–Ashe SYNERGY (вікі Ashe: матчап «even to strong»; синергії там не згадані). Синергії для додавання: Ana (Nano на B.O.B.), Mercy, Zarya, Anran (exceptional), Widowmaker (dual sniper).

**Bastion** ✅ Додати: Bastion→Winston, Wrecking Ball, Echo, Orisa, Domina, Reinhardt, Roadhog; D.Va→Bastion (very), Ana→Bastion. Також Brigitte: Bastion→Brigitte (toughest enemy). Синергії: Reinhardt, Torbjörn, Genji, Baptiste, Ana.

**Cassidy** ✅ Додати: Cassidy→Genji, Sombra, Vendetta, Wrecking Ball, Lucio, Mercy, Tracer; D.Va→Cassidy, Junker Queen→Cassidy, Ramattra→Cassidy, Winston→Cassidy, Orisa→Cassidy.
- Синергії: **Zarya (exceptional)**, **Sigma (strong)** замість/додатково до Mei, Reinhardt (Mei — (?)).

**Echo** ✅ Aerial Munitions застарів (розділ 2.1).
- Хибні: Echo→Widowmaker (**видалити**, див. 2.3).
- Додати (крім наявних Ashe/Cassidy/Soldier): D.Va→Echo (strong threat), Widowmaker→Echo, Bastion→Echo, Emre→Echo, Echo→Pharah (Pharah дуже слабка проти Echo). Echo→Reaper (вікі Reaper: Echo «strong against Reaper»), Echo→Doomfist, Echo→Roadhog (Roadhog слабкий vs Echo).
- Синергії: D.Va, Orisa (Terra Surge), Winston.

**Emre** ✅ (текст — розділ 2.2.) Додати: Emre→Echo, Pharah (є); Widowmaker→Emre (є, дуже); Jetpack Cat: Emre→Jetpack Cat. Хибні (?): категорія WEAK vs `dive` (на вікі він швидкий і самодостатній), Baptiste/Mei синергії без підстав. Вікі: Soldier ↔ Emre рівні.

**Freja** ✅ Нерфи вересня (Revdraw 30→28 тощо) у текстах немає чисел — ок. Вікі: усі матчапи TBA, тому D.Va→Freja, синергії Doomfist/Zenyatta — **без джерела (?)**. Пропозиція: додати Freja category `projectile` (є), перевірити дані ігровим тестом.

**Genji** ✅ Deflect 2 с→1.5 с (3 листопада): у тексті тривалості немає — ок.
- Додати (хто контрить Genji): Cassidy→Genji, Anran→Genji, Reaper→Genji, Orisa→Genji, Doomfist→Genji, Echo→Genji, Tracer→Genji (вікі «harder»), Mei→Genji (є), Pharah→Genji (Pharah strong).
- Хибні (?): Genji→Ashe/Hanzo/Widowmaker/Soldier — вікі «manageable/even»; Zarya→Genji суперечить Zarya (вікі: Genji difficult for Zarya) — вирішити напрямок.
- Синергії: Junker Queen, Reinhardt, Roadhog, Sigma, Winston, Wrecking Ball, Hanzo, Widowmaker, Symmetra, Vendetta (exceptional).

**Hanzo** ✅ Sonic Disruption 3 листопада (не перекриває хак Sombra) — ок.
- Хибні: Hanzo→Tracer (вікі: змішаний); Wrecking Ball→Hanzo (вікі: рівний); WEAK vs `flying` (?) — у вікі немає підстав.
- Додати: Hanzo→Orisa, Ashe, Cassidy, Doomfist, Symmetra, Ana, Zenyatta, Brigitte; Reinhardt→Hanzo, Mei→Hanzo, Reaper→Hanzo, Sombra→Hanzo, Widowmaker→Hanzo, Moira→Hanzo.
- Синергії: Reinhardt (Earthshatter), Zarya, Orisa, Mei (Dragonstrike combos), Mercy, Zenyatta, Genji, Winston (теж).

**Junkrat** ✅ Додати: Ashe→Junkrat, D.Va→Junkrat, Zarya→Junkrat, Widowmaker→Junkrat (є); Junkrat→Doomfist, Wrecking Ball, Junker Queen, Mercy, Vendetta (є).

**Mei** ✅ HP 300. Хибні (?): Mei→D.Va (вікі: рівний/ситуативний). Додати: Mei→Doomfist, Reaper, Soldier, Tracer, Mercy; Hanzo→Mei, Widowmaker→Mei, Zarya→Mei, Sombra→Mei, Symmetra→Mei, Junkrat→Mei, Zenyatta→Mei, Wrecking Ball? (Mei shuts him: Mei→Wrecking Ball). Синергії: Zarya, Reinhardt, Sigma, Ramattra, Ashe, Echo, Lifeweaver, Lucio.

**Pharah** ✅ Найкраще підтверджена вікі.
- Додати як «контрить Pharah»: Echo (дуже), Sierra (дуже), Sojourn, Ana, Baptiste, Doctrine, Juno (є), Illari (є), Ashe (є), Cassidy (є), Emre (є), D.Va (є), Soldier (є), Widowmaker (є).
- Додати «Pharah контрить»: Reaper, Genji, Tracer, Torbjörn, Junkrat (дуже), Doomfist, Zarya, Junker Queen (дуже), Roadhog (?), Winston, Orisa, Ramattra, Hazard, Domina, Anran, Shion, Kiriko, Lifeweaver.
- Хибні (?): Pharah→Sombra, Pharah→Mizuki — є, але у вікі прямих підстав немає (для Mizuki вікі каже «Pharah weak matchup» — тобто **Pharah контрить Mizuki, залишити**).
- Синергії: Mercy, Juno, Jetpack Cat, Lifeweaver, Zarya, Ana, Sierra (strong).

**Reaper** ✅ HP 300 (3 листопада) ✅. Це єдиний герой з Damage без жодного вихідного зв'язку. Додати: Reaper→Doomfist; Pharah, Echo, Hanzo, Widowmaker→Reaper (Widowmaker є); Orisa→Reaper, Winston→Reaper, Mei→Reaper, Brigitte→Reaper.
- Синергії: Reinhardt, Symmetra, Cassidy, Brigitte, Zarya (є), Ana, Baptiste, Lucio, Mei (є).

**Shion** ✅ (Survival Instinct додано 6 жовтня.) Текст — розділ 2.2. Категорії: додати `hitscan`. Синергії за вікі: Ana (Nano на Spree), Wuyang (Tidal Blast) замість/додатково до Winston, Wrecking Ball (?). Додати: Mizuki→Shion, Pharah→Shion.

**Sierra** ✅ Категорій немає: **додати `projectile`**. Жодного вихідного зв'язку: додати Sierra→Pharah (дуже) і синергію Pharah. Контри Genji/Moira — без джерела (?). Рекомендація: перегляд після гри (вікі TBA).

**Sojourn** ✅ HP 225. Категорія `long-range` сумнівна (mid-range). Додати: Sojourn→Pharah, Roadhog→Sojourn, Winston→Sojourn (є), Jetpack Cat: Sojourn→Jetpack Cat.

**Soldier: 76** ✅ Додати: Soldier→Jetpack Cat, Sombra→Soldier, Symmetra→Soldier, Zarya→Soldier, Moira→Soldier. Хибні (?): Widowmaker→Soldier (рівна дуель). Синергії: **Ana (strong)**, Mercy, Baptiste (є). Категорія: `self-healing` (?).

**Symmetra** ✅ HP 125 у вікі; Хибні: Tracer→Symmetra (**перевернути**), Symmetra→Domina (?), Torbjörn синергія (?). Додати: Symmetra→Reinhardt, Tracer, Genji (є), Lucio, Mercy, Ana, Soldier (Photon Barrier глушить Visor).
- Контр Symmetra: D.Va, Winston, Hanzo, Widowmaker (є), Reaper, Junkrat (є), Pharah (є), Zenyatta, Moira. Синергії: Teleporter + Ana/Bastion/Orisa/D.Va.

**Torbjörn** ✅ HP 225+75 броня. Нуль контр. Додати: D.Va, Junkrat, Pharah, Widowmaker, Hanzo, Ana→Torbjörn; Torbjörn→Roadhog, Reinhardt, Tracer, Lucio, Brigitte. Синергії: Reinhardt, Orisa, Mercy.

**Tracer** ✅ HP 175. Хибні: Tracer→Symmetra; Hanzo→Tracer. Додати: Tracer→Mercy, Lucio, Zenyatta; Cassidy→Tracer (major), Pharah→Tracer, Widowmaker→Tracer, Brigitte→Tracer, Mei→Tracer, Mizuki→Tracer, Torbjörn? (Torbjörn favorable vs Tracer → Torbjörn→Tracer). Категорія `short-range` додати.

**Vendetta** ✅ (Nov 3 нерфи — у тексті немає чисел.) Додати: Vendetta→Reinhardt (strong); Cassidy→Vendetta, Mei? ні; Mizuki→Vendetta, Pharah (є), Junkrat (є). Хибні (?): Vendetta→Shion, Widowmaker. Синергії: Reinhardt, Genji (exceptional), Doomfist, Wrecking Ball.

**Venture** ✅ Матчапів на вікі немає (TBA); поточні зв'язки — Venture→Kiriko, Rein→Venture, Pharah→Venture — залишити, але Pharah→Venture (very strong, перехресно) ✔.

**Widowmaker** ✅ HP 225.
- Хибні: Mercy→Widowmaker (**перевернути на Widowmaker→Mercy**), Echo→Widowmaker (**видалити**), Widowmaker→Soldier-76 (?).
- Додати: Widowmaker→Cassidy, Torbjörn, Mei, Zenyatta, Mercy, Mizuki; D.Va→Widow (near-impossible), Doomfist→Widow, Sombra→Widow, Ramattra→Widow, Winston→Widow (є), Wrecking Ball→Widow (є), Genji→Widow (є).
- Синергії: Baptiste (Amp), Mercy, Zenyatta, Brigitte, Ana, Domina (exceptional), Reinhardt (є).

### Танки

**D.Mon** ✅ (див. 2.1, 2.2). Додати: Reinhardt→D.Mon, Torbjörn→D.Mon; D.Mon→Domina, Sigma, Anran, Brigitte (very). Хибні (?): D.Mon→D.Va, D.Mon→Widowmaker. Категорія `hitscan` додати (Fusion Repeater) (?).

**Domina** ✅ Додати: Bastion→Domina, D.Mon→Domina, Pharah→Domina, Wuyang→Domina. Синергії за вікі: Widowmaker, Ramattra, Wrecking Ball, Tracer, D.Va (замість/до Mizuki, Torbjörn, Illari) (?). Хибні (?): Domina→Doomfist/Hazard/Winston/Wrecking Ball.

**Doomfist** ✅ HP 525 (5v5).
- Хибні: Doomfist→Ana (**перевернути на Ana→Doomfist**: Ana-комп — hard counter).
- Додати «контрить Doomfist»: Echo, Sombra, Mercy, Zenyatta, Mei, Reaper, Junkrat, Pharah, Illari, Ana; Doomfist→D.Va (D.Va unfavorable vs Doomfist).
- Синергії: Winston, Illari, Wuyang (є), Vendetta.

**D.Va** ✅ Додати: D.Va→Echo, Bastion, Widowmaker, Ashe, Cassidy, Symmetra, Kiriko, Juno, Moira, Torbjörn, Mauga; Doomfist→D.Va. Хибні (?): Mei→D.Va, Brigitte→D.Va (manageable), Reinhardt→D.Va (even). Синергії: Hazard, Domina, Zenyatta, Moira.

**Hazard** ✅ Категорії: додати `projectile`. Додати: Pharah→Hazard; D.Va синергія. Вікі: усе TBA — поточні контри без джерел (?).

**Junker Queen** ✅ HP 425 (оновлено 3 листопада). Додати: JQ→D.Va, JQ→Cassidy; Reinhardt, Sigma, Orisa, Pharah, Junkrat→JQ; Zarya→JQ. Категорія `hitscan` (?).

**Mauga** ✅ Armor 125→150, burn 15→20 (3 листопада, без чисел у тексті) ✔. Додати: **D.Va→Mauga (very)**, Mauga→Jetpack Cat (very), Mauga→Wuyang. Хибні (?): Jetpack Cat+Mauga SYNERGY суперечить «very weak» матчапу для Cat; Zenyatta→Mauga без прямої підстави.

**Orisa** ✅ Додати: Orisa→Reinhardt, Roadhog; D.Va, Zarya, Tracer, Reaper, Symmetra, Junkrat, Mei, Pharah, Anran→Orisa. Синергії: Echo, Kiriko, Symmetra, Hanzo.

**Ramattra** ✅ Void Accelerator ammo 100→125 (3 листопада). Категорії: додати `projectile`. Додати: Ramattra→Ana, Juno, Widowmaker. Синергії: Mei, Domina, Mauga? (JQ+Mauga good).

**Reinhardt** ✅
- Хибні: Reinhardt→Winston, Reinhardt→Wrecking Ball (**перевернути**: Winston→Reinhardt, Wrecking Ball→Reinhardt — вікі Rein: Ball «very weak»), Reinhardt→D.Va (?).
- Додати «контрить Rein»: Bastion (extreme), Mei, Reaper, Orisa, Pharah (є), Ramattra (є); Orisa, Roadhog? — Roadhog є; Reinhardt→Sigma, Domina, Zarya (є).
- Синергії: Zarya, Bastion, Cassidy (є), Reaper, Vendetta.

**Roadhog** ✅ Rework 6 жовтня (Scrap Gun 2 серії, Toxic Exhaust, Here, Piggy Piggy) — перки збігаються ✔.
- Конфлікти джерел (?): Ana→Roadhog (сторінка Ana — так, сторінка Roadhog — навпаки), Lucio→Roadhog (вікі Lucio: «hook difficult»), Doctrine→Roadhog (нема), Roadhog→Reinhardt/Hazard (рівно).
- Додати: Zarya→Roadhog (best counter), JQ, Orisa, Sigma, Cassidy, Echo, Widowmaker, Sombra, Kiriko→Roadhog; Roadhog→Jetpack Cat, Wuyang, Hanzo, Sojourn, Symmetra, Baptiste.
- Синергії: JQ, Ashe, Hanzo, Pharah, Reaper, Genji, Soldier, Mei, Brigitte, Kiriko.

**Sigma** ✅ Додати: Sigma→Junker Queen, Roadhog; D.Mon→Sigma, Brigitte→Sigma, Zarya→Sigma (є). Синергії: Baptiste, Cassidy, Lucio, Mei, Juno.

**Winston** ✅ **Revitalizing Barrier 35→30** (розділ 2.1).
- Хибні: Reinhardt→Winston (див. вище). Zarya→Winston (?).
- Додати: Bastion, Mei, Reaper, Symmetra, D.Va→Winston; Winston→Cassidy, Ashe, Hanzo.
- Синергії: Doomfist, Reinhardt, Roadhog, Hanzo, Echo.

**Wrecking Ball** ✅ Хотфікс 5 листопада (Grappling Claw +15% retract speed). Додати: Ball→Ashe, Reinhardt; Pharah, Mei, Sombra, Cassidy, Bastion→Ball. Хибні: Wrecking Ball→Hanzo (?). Синергії: Lucio, Ana, Brigitte, Mercy, Zarya, Sigma, Widowmaker, Domina.

**Zarya** ✅ Хибні (?): Zarya→Genji (вікі Zarya: Genji difficult for her). Додати: Zarya→JQ, Roadhog, Junkrat, Anran, Ana, Juno, Moira, Soldier; Orisa, Mei, Echo, Pharah, Genji→Zarya. Синергії: Reinhardt, Cassidy, Bastion, Pharah, Hanzo, Sojourn, Orisa, Mei, Wrecking Ball.

### Саппорти

**Ana** ✅ Biotic Grenade 90→60 (3 листопада), в описі Biotic Bounce уже 60 ✔. Додати: Ana→Doomfist, Bastion, Pharah, Roadhog (є), Cassidy (є), Domina (є); D.Va, Orisa, Ramattra, Sigma, Zarya, Winston (є), Reaper, Tracer (є), Genji→Ana. Хибні: Doomfist→Ana (див. вище).

**Baptiste** ✅ Нуль вихідних зв'язків. Додати: Baptiste→Pharah; Sombra→Baptiste (EMP знищує Immortality Field), Winston/Doomfist слабкі синергії. Синергії: Ana, Sigma, Reinhardt, Roadhog, Pharah (Amp), Widowmaker (Amp).

**Brigitte** ✅ Inspire 3 листопада. Додати: Brigitte→Anran, Tracer, Reaper, Symmetra, Ana, Moira, Sigma, Roadhog; Bastion, Ashe, Hanzo, Widowmaker, Pharah, Reinhardt, Orisa→Brigitte. Хибні (?): Brigitte→D.Va («manageable»), Brigitte→Wrecking Ball/Shion (без джерела). Синергії: Sigma, Roadhog, Reinhardt, Zarya, Zenyatta (є); Lucio не рекомендований.

**Doctrine** ✅ (розділ 2.2; перки OK; Cost of Life вимкнений.) Релізи 3 листопада (кулдауни Shrouded Momentum 8→10, Infuse 8→9, Infused dmg/healing) — опис Transfusion/Infuse перевір. Категорії `projectile`/`backline-healers` сумнівні, `flying` (?). Усі контри/синергії без джерел (вікі TBA); Pharah→Doctrine (wiki: Doctrine сильний проти Pharah, тож **Doctrine→Pharah**).

**Illari** ✅ Pylon +10 heal/projectile (3 листопада). Додати: Illari→Doomfist; Doomfist-синергія; Anran→Illari (**перевернути**). Категорія `backline-healers` сумнівна.

**Jetpack Cat** ✅ HP 225→200 (3 листопада). Додати як «контрить»: Mauga (very), Roadhog (very), Emre, Sojourn, Widowmaker, Ashe (є), Cassidy (є); Soldier→JC, Anran→JC. Синергії: Ana, Winston, Juno, Doomfist, Reinhardt (замість Mauga).

**Juno** ✅ Додати: D.Va, Winston, Wrecking Ball, Sombra, Ramattra, Zarya→Juno; Juno→Pharah (є). Синергії: Lucio, Mauga, Reinhardt (є), Sigma, Zarya, Mercy.

**Kiriko** ✅ Категорії: додати `projectile`. Хибні: Anran→Kiriko (**перевернути**). Додати: D.Va, Winston→Kiriko; Kiriko→Junker Queen (є), Sombra (є). Синергії: Tracer, Genji (є), Orisa, Reinhardt (є), Roadhog.

**Lifeweaver** ✅ Нуль вихідних. Рід — he/him (розділ 2.2). Додати: Anran→Lifeweaver, Pharah→Lifeweaver (категорійна є), Doctrine→Lifeweaver (Deliverance vs Tree of Life). Синергії: Anran, Pharah, Zarya (є), Mei (Petal Platform).

**Lucio** ✅ Хибні: **Lucio→Roadhog** (**перевернути** на Roadhog→Lucio). Додати: Sombra, Moira (?), Cassidy, Zarya, Mei, Torbjörn→Lucio; Lucio→Sigma, Widowmaker (close), Reaper, Ana. Синергії: Reinhardt (є), Roadhog, Sigma, Ana (є), Juno, Wrecking Ball.

**Mercy** ✅ Хибні: **Mercy→Widowmaker** (перевернути). Додати: Cassidy, D.Va, Roadhog, Zarya, Orisa, Junkrat, Mei, Reaper, Bastion, Widowmaker→Mercy; Genji→Mercy (є); Pharah→Mercy (?) — суперечить синергії Pharah+Mercy у БД (вікі Pharah: Mercy strong matchup). Синергії: Pharah (є), Ashe, Orisa, Reaper, Bastion (є), Wrecking Ball.

**Mizuki** ✅ Додати: Mizuki→Shion, Tracer, Vendetta; Widowmaker→Mizuki (very); Pharah→Mizuki ✔ (є). Синергія Brigitte замість/до Baptiste (?).

**Moira** ✅ Хибні (?): Moira→Anran, Moira→Sierra (без джерела); текст слабких сторін про Symmetra. Нуль контрованих: додати Zarya, D.Va, Roadhog, Orisa, Soldier, Torbjörn, Bastion, Wrecking Ball, Echo, Widowmaker→Moira. Додати: Moira→Symmetra, Tracer, Zenyatta, Mercy, Junkrat, Brigitte (на дистанції). Конфлікт джерел Moira↔Lucio (вікі Lucio проти вікі Moira). Синергії: Winston, D.Va, Baptiste, Lucio/Juno.

**Sombra** ✅ Season 5 (Support/Tactician) ✅. Додати: Sombra→Lucio, Juno, Widowmaker, Soldier, Hanzo, Zenyatta, Mei, Baptiste, Wrecking Ball; Cassidy→Sombra, Roadhog→Sombra. Хибні (?): Pharah→Sombra без підстав.

**Wuyang** ✅ Додати: Mauga, Roadhog, Genji, Tracer, Doomfist→Wuyang; Wuyang→Domina? (вікі: strong vs Domina, JQ, Ramattra, Rein, Hazard, D.Va — це змішано з синергіями, перевір). Синергії: Doomfist (є), Junker Queen, Reinhardt, Shion (Tidal Blast). Хибні (?): Winston/Wrecking Ball→Wuyang без прямої підстави.

**Zenyatta** ✅ Додати: Hanzo, Widowmaker, Roadhog, Junkrat, Zarya, Sombra, Reaper (близько)→Zenyatta; Zenyatta→D.Va, Bastion, Pharah. Хибні (?): Zenyatta→Mauga (без прямої підстави), синергія Genji (нема на вікі). Синергії: D.Va, Tracer (є), Ana/Baptiste.

## 4. Що потрібно від тебе, перш ніж виправляти

1. **Правила категорій** (розділ 2.5): чи робити їх «за основною зброєю» (як у таблиці), чи залишити як зараз (вибіркові).
2. **Конфлікти джерел** (позначені (?)): Ana↔Roadhog, Lucio↔Roadhog, Moira↔Lucio, Zarya↔Genji, Pharah↔Roadhog, Reinhardt↔D.Va. Пропоную: де обидві сторінки вікі суперечать одна одній — лишати як є і додавати застереження в «Limits».
3. **Обсяг додавань**: пропонований обсяг — ~140 нових зв'язків. Пропоную спочатку виправити (а) хибні/перевернуті зв'язки, (б) застарілі перки, (в) помилки текстів, (г) категорійні конфлікти, а потім додати зв'язки порційно по ролях.
