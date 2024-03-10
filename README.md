---
layout:
  title:
    visible: true
  description:
    visible: true
  tableOfContents:
    visible: true
  outline:
    visible: true
  pagination:
    visible: true
---

# Запити зацікавлених осіб

## Вступ

Цей розділ призначений для осіб, які зацікавленні у використанні системи Intelligent Image Analyzer. Він містить інформацію про цільову аудиторію, різноманітні бізнес-сценарії та формулює основні вимоги до різних аспектів системи.

### Мета

Надати особам, зацікавленим у використанні системи Intelligent Image Analyzer, повну інформацію щодо цільової аудиторії продукту, різних бізнес-сценаріїв та вимог до системи, щоб вони могли краще зрозуміти можливості та переваги використання цієї системи.

### Контекст

Цей документ детально описує всі можливі сценарії взаємодії із системою, та вимоги, яким має відповідати готовий продукт.

### Основні визначення

* [**Мікросервісна архітектура**](https://medium.com/@IvanZmerzlyi/microservices-architecture-461687045b3d) - альтернатива монолітній архітектурі, яка передбачає розбиття програмного забезпечення на невеликі, автономні сервіси, які реалізують певні функції і спілкуються між собою через визначені API. Кожен мікросервіс може бути розроблений, розгорнутий і масштабований незалежно від інших, що дозволяє збільшити швидкість розробки та поліпшити надійність системи.
* [**Representational State Transfer**](https://uk.wikipedia.org/wiki/REST) **(Rest) -** архітектурний стиль інтерфейсів, що використовує стандартні HTTP-методи для обміну даними між системами.
* [**Автентифікація**](https://uk.wikipedia.org/wiki/%D0%90%D0%B2%D1%82%D0%B5%D0%BD%D1%82%D0%B8%D1%84%D1%96%D0%BA%D0%B0%D1%86%D1%96%D1%8F) **-** процес перевірки ідентичності користувача або системи перед наданням доступу до ресурсів.
* [**API Gateway**](https://highload.today/api-gateway-endpoints/) - сервіс, який діє як єдина точка входу для всіх клієнтських запитів до мікросервісів у системі. Він відповідає за маршрутизацію запитів до відповідних мікросервісів та агрегацію результатів від різних сервісів.
* [**Computer vision** ](https://en.wikipedia.org/wiki/Computervision)- галузь штучного інтелекту, яка надає комп'ютерам здатність "бачити" і інтерпретувати візуальну інформацію, аналізуючи зображення та відео. Це може включати розпізнавання об'єктів, відстеження руху, визначення особливостей сцен та інше.
* [**gRPC** ](https://uk.wikipedia.org/wiki/GRPC)**-** високопродуктивний фреймворк відкритого коду для виклику віддалених процедур (RPC), розроблений Google. Він використовує HTTP/2 для транспорту, Protocol Buffers як мову опису інтерфейсу, і забезпечує можливості, такі як аутентифікація, навантажувальне балансування, блокування і контроль доступу.
* [**Message broker**](https://en.wikipedia.org/wiki/Message\_broker) **-** посередник, який управляє передачею повідомлень між компонентами системи, забезпечуючи асинхронну комунікацію та розподіл навантаження.
* [**Advanced Message Queuing Protocol** ](https://uk.wikipedia.org/wiki/AMQP)**(AMQP)** - відкритий стандартний протокол для асинхронного обміну повідомленнями між системами. AMQP визначає механізми для маршрутизації, чергування та надійної доставки повідомлень, забезпечуючи сумісність та надійність у складних розподілених системах.
* [**RabbitMQ** ](https://en.wikipedia.org/wiki/RabbitMQ)- відкритий **message broker,** що слугує проміжною платформою для обміну повідомленнями між різними компонентами або системами в мікросервісній архітектурі. Він реалізує протокол **AMQP** та підтримує різноманітні меседжинг-патерни, включаючи роботу з чергами, публікацію/підписку, маршрутизацію та теми.
* [**Secure Sockets Layer**](https://uk.wikipedia.org/wiki/SSL) **/** [**Transport Layer Security**](https://uk.wikipedia.org/wiki/Transport\_Layer\_Security) **(SSL/TLS) -** криптографічні протоколи для забезпечення безпечної передачі даних через мережу, зашифровуючи інформацію між веб-сервером і браузером.
* [**JSON Web Token**](https://uk.wikipedia.org/wiki/JSON\_Web\_Token) **(JWT) -** відкритий стандарт для створення токенів доступу, що дозволяє безпечно передавати інформацію між сторонами у формі JSON-об'єкта, здатного бути підписаним і зашифрованим.
* [**Хеш сіль**](https://uk.wikipedia.org/wiki/%D0%A1%D1%96%D0%BB%D1%8C\_\(%D0%BA%D1%80%D0%B8%D0%BF%D1%82%D0%BE%D0%B3%D1%80%D0%B0%D1%84%D1%96%D1%8F\)) **-** випадково згенерована додаткова інформація, яка додається до пароля перед його хешуванням. Використання солі робить кожен хеш унікальним навіть для однакових паролів і значно ускладнює використання райнбоу-таблиць для взлому паролів.
* [**Rainbow table**](https://uk.wikipedia.org/wiki/%D0%A0%D0%B0%D0%B9%D0%B4%D1%83%D0%B6%D0%BD%D0%B0\_%D1%82%D0%B0%D0%B1%D0%BB%D0%B8%D1%86%D1%8F) - пре-вирахована таблиця значень хешів для кожного можливого пароля. Ці таблиці дозволяють швидко знаходити відповідність між хешем та вихідним паролем, значно скорочуючи час, необхідний для взлому паролів. Використання солі при хешуванні паролів робить райнбоу-таблиці неефективними.
* [**Brute-force attack**](https://uk.wikipedia.org/wiki/%D0%9C%D0%B5%D1%82%D0%BE%D0%B4\_%C2%AB%D0%B3%D1%80%D1%83%D0%B1%D0%BE%D1%97\_%D1%81%D0%B8%D0%BB%D0%B8%C2%BB) - метод злому, при якому автоматизована система перебирає всі можливі комбінації паролів або ключів шифрування до знаходження правильного. Цей метод є дуже часозатратним і його ефективність зменшується зі збільшенням довжини пароля та складності алгоритму хешування.
* [**Dictionary attack**](https://uk.wikipedia.org/wiki/%D0%9F%D0%B5%D1%80%D0%B5%D0%B1%D1%96%D1%80\_%D0%B7%D0%B0\_%D1%81%D0%BB%D0%BE%D0%B2%D0%BD%D0%B8%D0%BA%D0%BE%D0%BC) - метод злому, при якому зловмисник використовує список загальновідомих, часто використовуваних або потенційно можливих паролів (словник) для спроби вгадати пароль. В порівнянні з brute-force атаками, словникові атаки є швидшими, але менш ефективними проти складних, унікальних паролів.
* [**bcrypt** ](https://uk.wikipedia.org/wiki/Bcrypt)- криптографічний алгоритм хешування паролів, розроблений для забезпечення безпеки зберігання паролів. Він використовує сіль для запобігання атакам за допомогою райнбоу-таблиць та має можливість налаштування кількості ітерацій (коефіцієнт складності), що робить атаки методом грубої сили менш ефективними.

## Зміст

1. [Бізнес сценарії](./#biznes-scenariyi)
2. [Короткий огляд продукту](./#korotkii-oglyad-produktu)
3. [Вимоги](./#vimogi)
   * [Функціональність](./#funkcionalnist)
   * [Практичність](./#praktichnist)
   * [Надійність](./#nadiinist)
   * [Продуктивність](./#produktivnist)
   * [Експлуатаційна придатність](./#ekspluataciina-pridatnist)

## Бізнес сценарії

### Неаутентифікований користувач

<table><thead><tr><th width="165">ID</th><th>DC_1.1</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Зареєструвати користувача</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач не має облікового запису в системі</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Створений обліковий запис користувача</td></tr><tr><td><strong>ВИКЛЮЧНІ СИТУАЦІЇ</strong></td><td>DС_EX1_1.1 Користувач не заповнив усі обов'язкові поля для реєстрації</td></tr><tr><td></td><td>DС_EX2_1.1 Обліковий запис вже існує у системі</td></tr><tr><td></td><td>DС_EX3_1.1 Введені дані не відповідають вимогам</td></tr><tr><td><strong>ОСНОВНИЙ СЦЕНАРІЙ</strong></td><td><ol><li>Користувач вводить дані для реєстрації</li></ol></td></tr><tr><td></td><td><ol start="2"><li>Користувач відправляє запит на створення облікового запису.<br>Можливі виключні ситуації:<br>- NullReferenceException<br>- NotStrongPassException<br>- BadEmailException<br>- BadFirstNameException<br>- BadLastNameException</li></ol></td></tr><tr><td></td><td><ol start="3"><li>Сервіс Gateway отримує дані та передає їх до Auth сервісу</li></ol></td></tr><tr><td></td><td><ol start="4"><li>Auth сервіс перевіряє наявність облікового запису<br>можлива:<br>- UserAlreadyExistsException</li></ol></td></tr><tr><td></td><td><ol start="5"><li>Auth сервіс створює новий обліковий запис</li></ol></td></tr><tr><td></td><td><ol start="6"><li>Auth сервіс відправляє повідомлення Gateway про необхідність підтвердження облікового запису за домопомогою пошти</li></ol></td></tr><tr><td></td><td><ol start="7"><li>Користувач переходить по посиланню, яке прийшло на введену пошту при реєстрації</li></ol></td></tr><tr><td></td><td><ol start="8"><li>Користувач має підтверджений створений обліковий запис</li></ol></td></tr></tbody></table>

<table><thead><tr><th width="165">ID</th><th>DC_1.2</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Авторизувати користувача</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач має обліковий запис в системі<br>Користувач не авторизован в системі</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач авторизован у системі</td></tr><tr><td><strong>ВИКЛЮЧНІ СИТУАЦІЇ</strong></td><td>DС_EX1_1.2 Користувач не заповнив усі обов'язкові поля форми для авторизації</td></tr><tr><td></td><td>DС_EX2_1.2 Користувач ввів неіснуючі або некоректні данні у форму для авторизації</td></tr><tr><td><strong>ОСНОВНИЙ СЦЕНАРІЙ</strong></td><td><ol><li>Користувач вводить дані для авторизації</li></ol></td></tr><tr><td></td><td><ol start="2"><li>Користувач відправляє запит для авторизації<br>можливо:<br>- NullReferenceException</li></ol></td></tr><tr><td></td><td><ol start="3"><li>Сервіс Gateway отримує дані та передає їх до Auth сервісу</li></ol></td></tr><tr><td></td><td><ol start="4"><li>Auth сервіс перевіряє наявність облікового запису<br>можливо:<br>- UserDoesNotExistException</li></ol></td></tr><tr><td></td><td><ol start="5"><li>Auth сервіс відправляє повідомлення Gateway про успішну авторизацію користувача</li></ol></td></tr><tr><td></td><td><ol start="6"><li>Користувач авторизован у системі</li></ol></td></tr></tbody></table>

<table><thead><tr><th width="165">ID</th><th>DC_1.3</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Проаналізувати зображення</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service, CV Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач не авторизован в системі<br>Користувач відправляв менше ніж 3 зображення на аналіз</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримав аналіз до відправленного зображення</td></tr><tr><td><strong>ВИКЛЮЧНІ СИТУАЦІЇ</strong></td><td>DС_EX1_1.3 Користувач завантажив файл без необхідних параметрів, які характерні файлу з зображенням</td></tr><tr><td><strong>ОСНОВНИЙ СЦЕНАРІЙ</strong></td><td><ol><li>Користувач завантажує файл зображення на відповідний ендпоінт</li></ol></td></tr><tr><td></td><td><ol start="2"><li>Gateway отримує файл зображення від користувача <br>можливо:<br>- BadFileException </li></ol></td></tr><tr><td></td><td><ol start="3"><li>Gateway робить запит до Auth сервісу для перевірки ліміту запитів<br>можливо:<br>- ExceededUnauthRequestLimitException</li></ol></td></tr><tr><td></td><td><ol start="4"><li>Gateway отримує відповідь від Auth сервісу з  дозволенням на запит</li></ol></td></tr><tr><td></td><td><ol start="5"><li>Gateway відправляє файл з зображенням на CV сервіс</li></ol></td></tr><tr><td></td><td><ol start="6"><li>CV сервіс отримує та проводить аналіз  файлу зображення</li></ol></td></tr><tr><td></td><td><ol start="7"><li>CV сервіс відправляє результати аналізу до Gateway</li></ol></td></tr><tr><td></td><td><ol start="8"><li>Gateway отримує результат аналізу та повертає його користувачу</li></ol></td></tr></tbody></table>

<table><thead><tr><th width="165">ID</th><th>DC_1.4</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Проаналізувати зображення заборонено</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service, CV Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач не авторизован в системі<br>Користувач відправляв 3 зображення на аналіз</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримав помилку про вичерпаний ліміт запитів</td></tr><tr><td><strong>ВИКЛЮЧНІ СИТУАЦІЇ</strong></td><td>-</td></tr><tr><td><strong>ОСНОВНИЙ СЦЕНАРІЙ</strong></td><td><ol><li>Користувач завантажує файл зображення на відповідний ендпоінт</li></ol></td></tr><tr><td></td><td><ol start="2"><li>Gateway отримує файл зображення від користувача <br>можливо:<br>- BadFileException</li></ol></td></tr><tr><td></td><td><ol start="3"><li>Gateway робить запит до Auth сервісу для перевірки ліміту запитів користувача</li></ol></td></tr><tr><td></td><td><ol start="4"><li>Gateway отримує повідомлення про заборону на запит</li></ol></td></tr><tr><td></td><td><ol start="5"><li>Користувач отримує повідомлення про вичерпаний ліміт на запити</li></ol></td></tr></tbody></table>

### Аутентифікований користувач

<table><thead><tr><th width="165">ID</th><th>DC_2.1</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Проаналізувати зображення</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service, CV Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач авторизован в системі</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримав аналіз до відправленного зображення</td></tr><tr><td><strong>ВИКЛЮЧНІ СИТУАЦІЇ</strong></td><td>DС_EX1_2.1 Користувач завантажив файл без необхідних параметрів, які характерні файлу з зображенням</td></tr><tr><td><strong>ОСНОВНИЙ СЦЕНАРІЙ</strong></td><td><ol><li>Користувач завантажує файл зображення на відповідний ендпоінт</li></ol></td></tr><tr><td></td><td><ol start="2"><li>Gateway отримує файл зображення від користувача <br>можливо:<br>- BadFileException</li></ol></td></tr><tr><td></td><td><ol start="3"><li>Gateway робить запит до Auth сервісу для перевірки валідності JWT токену</li></ol></td></tr><tr><td></td><td><ol start="4"><li>Auth сервіс відправляє повідомлення про валідність токену до Gateway</li></ol></td></tr><tr><td></td><td><ol start="5"><li>Gateway відправляє файл з зображенням на CV сервіс</li></ol></td></tr><tr><td></td><td><ol start="6"><li>CV сервіс отримує та проводить аналіз  файлу зображення</li></ol></td></tr><tr><td></td><td><ol start="7"><li>CV сервіс відправляє результати аналізу до Gateway</li></ol></td></tr><tr><td></td><td><ol start="8"><li>Gateway отримує результат аналізу та повертає його користувачу</li></ol></td></tr></tbody></table>

### Адміністратор

<table><thead><tr><th width="165">ID</th><th>DC_2.1</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Редагування даних  у базі даних </td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Адміністратор, система з мікросервісів </td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач має роль адміністратора</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Адміністратор відредагував дані у БД</td></tr><tr><td><strong>ВИКЛЮЧНІ СИТУАЦІЇ</strong></td><td></td></tr><tr><td><strong>ОСНОВНИЙ СЦЕНАРІЙ</strong></td><td><ol><li>Адміністратор входить до системи редагування даних у БД </li></ol></td></tr><tr><td></td><td><ol start="2"><li>Система перевіряє права на редагування даних у БД</li></ol></td></tr><tr><td></td><td><ol start="3"><li>Адміністратор модифікує дані у БД</li></ol></td></tr><tr><td></td><td><ol start="4"><li>Адміністратор підтверджує зміни у БД</li></ol></td></tr><tr><td></td><td><ol start="5"><li>В системі змінились дані у БД</li></ol></td></tr></tbody></table>

## Короткий огляд продукту

_**Intelligent Image Analyzer**_ - це платформа для аналізу зображень, яка використовує технології _computer vision_ для надання детального опису вмісту зображень. Цей проект розроблений для того, щоб допомогти користувачам отримувати інформацію про зображення автоматично, зменшуючи потребу в ручному аналізі та інтерпретації.

Платформа пропонує два режими користування:

* для **автентифікованих користувачів** - надається безлімітний доступ до функцій аналізу зображень;
* для **неавтентифікованих користувачів** - надається можливість провести до 10 аналізів зображень.

Це робить Intelligent Image Analyzer зручним як для індивідуальних користувачів, так і для організацій, які потребують масштабного аналізу візуального контенту.

Основні категорії користувачів платформи:

* **Розробники та інженери з даних** - фахівці, які інтегрують Intelligent Image Analyzer у свої проекти або використовують його для автоматизації аналізу зображень та покращення візуального розпізнавання.
* **Компанії та бізнес-користувачі** - організації, які потребують аналізу великих об'ємів зображень для досліджень ринку, контент-менеджменту або цілей маркетингу.
* **Наукові дослідники** - особи, що займаються науковими дослідженнями та використовують аналіз зображень для збору даних, їх інтерпретації та аналізу в рамках своїх проектів.
* **Навчальні заклади** - університети та школи, які включають Intelligent Image Analyzer у свої навчальні курси з комп'ютерного зору, штучного інтелекту та суміжних дисциплін.

## Вимоги

### Функціональність

* **Реєстрація**: Процес реєстрації користувачів в системі Intelligent Image Analyzer є вступним етапом, що дозволяє отримати доступ до комплексного аналізу зображень. Потенційний користувач надає свої персональні дані (ім'я, прізвище, електронна адреса, пароль). Дані передаються до auth-svc, де вони зберігаються у базі даних для створення облікового запису користувача. Для завершення процесу реєстрації та підтвердження акаунту, на вказану електронну адресу надсилається лист із посиланням для активації аккаунта. Користувач має перейти за цим посиланням для завершення процедури реєстрації.
* **Автентифікація**: Автентифікація користувачів здійснюється через введення електронної адреси та паролю. Ці дані перевіряються auth-svc на відповідність зареєстрованим у базі даних. У разі успішної верифікації користувач отримує JWT, що діє як цифровий ключ для доступу до функціоналу системи, зокрема до сервісу обробки зображень. JWT слугує механізмом забезпечення ідентифікації користувача та його прав на отримання необмеженого доступу до аналізу зображень для автентифікованих користувачів.
* **Завантаження зображення та отримання опису**: Користувачам надається можливість завантажувати зображення для їх аналізу. Сервіс для маршрутизації перенаправляє запити на завантаження зображень до grpc-vision-svc, який використовує алгоритми сomputer vision для обробки та аналізу зображень. В результаті аналізу, користувач отримує текстовий опис вмісту завантаженого зображення.

### Практичність

* **Ефективність обробки зображень**: **С**ервіс забезпечує швидку та точну обробку зображень, мінімізуючи час від завантаження зображення до отримання результатів аналізу.
* **Широкий спектр розпізнавання об'єктів**: Сервіс включає розширені можливості для розпізнавання широкого спектру об'єктів на зображеннях, від простих форм до складних сцен, щоб задовольнити потреби різноманітних категорій користувачів.
* **Доступність**: сервіс є безкоштовним без необхідності підписки або оплати.
* **Зрозуміла та доступна документація**: Детально структурована і охоплює всі аспекти використання сервісу, забезпечуючи легкий доступ до інформації для користувачів будь-якого рівня.

### Надійність

* **Зашифроване з'єднання:** **SSL/TLS** забезпечує безпеку між мікросервісами, зашифровуючи комунікацію між ними та перевіряючи їх аутентичність. Він працює шляхом створення зашифрованого каналу, обміну сертифікатами для перевірки ідентичності та генерації спільного ключа для шифрування даних.
* **Хешування паролів через bcrypt:** Забезпечує зберігання паролів у безпечному вигляді. **Bcrypt** є так званим 'повільним' алгоритмом хешуваня, що значно ускладнює _**Brute-force**_ та _**dictionary**_ атаки. **Bcrypt** також включає в себе  "сіль" (salt), яка змішується з паролем перед хешуванням, щоб ускладнити атаки з використанням "райдужних таблиць" (**Rainbow table**). Це означає, що навіть якщо двоє користувачів використовують один і той же пароль, їх хеші будуть різними через унікальну сіль для кожного користувача. Це допомагає забезпечити високий рівень безпеки паролів у системі.
* **Політика складних паролів:** Визначені вимоги до паролів змушують користувачів вказувати складні паролі при реєстрації (паролі мають відповідати певним вимогам: мінімальна довжина, наявність символів різних регістрів, наявність спецсимволів та ін.), що суттєво ускладнює підбір паролів.
* **Надійність доставки:** Використання протоколів **gRPC** та **AMQP** гарантує надійність обміну даними у системі. Обидва протоколи забезпечують цілісність даних, гарантовану доставку повідомлень, масштабованість та робустність системи. Вони також підтримують шифрування та аутентифікацію, забезпечуючи безпеку передачі інформації в мережі. Такий підхід забезпечує ефективну та надійну взаємодію між компонентами системи.
* **Безпека пам'яті:** Для розробки найбільш складної та ключової частини системи (**Computer Vision Service**) було обрано мову програмування **Rust**, яка є надійним вибором через її вбудовані механізми безпеки та надійності. **Rust** відома своєю системою управління пам'яттю, яка надійно захищає від небезпечних ситуацій, таких як помилки доступу до пам'яті, нульові покажчики, переповнення буфера, витоки пам'яті тощо. Це допомагає уникнути багатьох типових помилок, які можуть призвести до вразливостей та непередбачуваної поведінки системи. **Rust** також використовує строгу систему типів для перевірки на стадії компіляції, що сприяє виявленню багатьох помилок ще до виконання програми, забезпечуючи надійність та стабільність роботи системи.

### Продуктивність

* **Висока швидкість обробки зображень:** Використання мови **Rust** для **CV** сервісу дозволяє отримати високу швидкість обробки завдяки низькорівневій природі мови програмування **Rust** і вбудованої підтримки асинхронних операцій. Використання **gRPC** для взаємодії між **API Gateway** та **Computer Vision Service** забезпечує ефективну передачу даних і зменшує накладні витрати у порівнянні з іншими механізмами, такими як **REST** (**gRPC** дозволяє передавати дані у 5-7 разів швидше).
* **Масштабування:** Використання мікросервісної архітектури дозволяє гнучко масштабувати окремі компоненти системи незалежно один від одного. Це особливо важливо в області обробки зображень, де може знадобитися різна кількість ресурсів відповідно до навантаження на систему.
* **Низька латентність:** Використання **RabbitMQ** для взаємодії між **API Gateway** та **Auth Service** дозволяє забезпечити низьку затримку завдяки асинхронній обробці запитів і можливості розпаралелювання обробки даних.
