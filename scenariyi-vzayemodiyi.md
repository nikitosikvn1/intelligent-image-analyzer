# Сценарії взаємодії

## Схема взаємодії сервісів

<figure><img src=".gitbook/assets/msvcs-seq.png" alt=""><figcaption><p>Sequence діаграма взаємодії сервісів в системі</p></figcaption></figure>

* **User** - Кінцевий користувач системи.
* **HTTP Client** - Клієнт, який робить HTTP запити (це може бути як частина іншого сервісу, так і окремий користувач).
* **API Gateway** - Централізований сервіс, який функціонує як посередник між зовнішніми клієнтами та внутрішніми бекенд-сервісами. Він надає інтерфейс у вигляді REST API для взаємодії із системою. Окрім цього, API Gateway відповідає за обробку та маршрутизацію запитів до відповідних бекенд-сервісів.
* **Auth Service** - Відповідає за процес верифікації ідентичності користувачів та надання їм доступу до ресурсів або послуг. Він займається реєстрацією нових користувачів, генерацією JWT токенів та їх подальшою валідацією.
* **Auth DB** - База даних, яка зберігає облікові записи користувачів та пов'язану з ними інформацію.
* **Computer Vision Service** - Аналізує отримане зображення та генерує відповідний йому опис.
* **Computer Vision DB** - База даних, яка зберігає результати аналізу зображень.

## Модель прецедентів <a href="#model-precedentiv" id="model-precedentiv"></a>

<figure><img src=".gitbook/assets/users.jpg" alt=""><figcaption><p>Модель прецедентів</p></figcaption></figure>

## Сценарії використання

### Користувач без облікового запису

<table><thead><tr><th width="255">ID</th><th>DC_1.1</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Реєстрація користувача</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач не має облікового запису в системі</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Створений обліковий запис користувача</td></tr></tbody></table>

<figure><img src="https://www.plantuml.com/plantuml/png/bLN1JXH14BttLzJDnSGOzSOI0b62taZau8s0Re04WU2WCTa32m4k18mQD1fZm4HlPXaO6LXs-8NgF_8zYcN6xM6379ZfcgvwhrwzxXrw5KqkHSilvrnTlsZcLpJr3R_grpJMfj-iYnFyNMogsdk_b6qKRMjJZtn3KsqXy54UZu-FYHuZUewjgw97ceaR7diYevDHxStaMs6A83t5hZQBQ89dgYTIct-nk30x7o5VNB0ZyzjoWRq2z5Do01i6yRfBz1mMtq3RrGkmzQisldKnrXZfHyZBx0rGYUHBFC-mampQVeUyX8I0VUZNhBtXvMX6djQMNiy-hrtA9G0lH7FqxqnbPRInSu6kPrWqA5N6vZG5NfFzwg5crn8n6Lr8tehvBLJc2qlnesMoE269mVfDB2kt-_8Pxo4ZvfpzDiXPQeV9QJX_K808PIGmJaTqFT0MSZRyhkW1biUQGZIoGdGTu4Nq3-Ie2ISCT82mq2asj_pMrLWwepCTMAp5npcHoPxv2FufZ2nXz_GC7SCegdmI-W21X0MlxGujX2PtUcAYsFmBDglUr7Ky9u5mVgkK1oJ6rsD1-c578QQWf4tKXReWIkw1VynqvomWh8JeWL_liexheUODnCpFGEdbqlD2GG2C42IFqP7nubt2ENIT4ZHJqhor7ZP1MmKDGDsSF1RE9Bi53GdTxgXFNjgY8VcP179k3OfRxToQ2ujLDrURndKcIxFJCv4Rc1hKz_eP3N_Lt_eBPjZ0KKDWNt_eE_sf6xhPFt1tQf0xUI1jGcbNivnGyV2KUzOAtP573oT6datSauhkytxKJFwv88NJ3nn8Rn9ratrQJJlDmTNhT_i8edj4kIyLSxXjBsUMGB5ynpNes_zpT_LTwfKBnZIxm9X2f5wNM22PTVD0AgNUf0bYtaVKqNwHmkF0OEudMyOyFyBZfMtpO0ocLfsoK4kunJpZXl0FFyr_0G00" alt=""><figcaption><p>DC_1.1</p></figcaption></figure>

<table><thead><tr><th width="255">ID</th><th>DC_1.2</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Аналіз зображення</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, CV Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач не вказав JWT у заголовках HTTP запиту<br>Користувач використав меньше трьох спроб для аналізу</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримує опис зображення</td></tr></tbody></table>

<figure><img src=".gitbook/assets/edited_d_1.png" alt=""><figcaption><p>DC_1.2</p></figcaption></figure>

<table><thead><tr><th width="255">ID</th><th>DC_1.3</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Вичерпання ліміту запитів</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач не вказав JWT у заголовках HTTP запиту Користувач використав три спроби для аналізу</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримує повідомлення про вичерпаний ліміт запитів</td></tr></tbody></table>

<figure><img src=".gitbook/assets/edited_d_2.png" alt=""><figcaption><p>DC_1.3</p></figcaption></figure>

### Користувач із існуючим обліковим записом

<table><thead><tr><th width="255">ID</th><th>DC_2.1</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Генерація JWT</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач має підтверджений обліковий запис в системі</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримує сгенерований JWT</td></tr></tbody></table>

<figure><img src="https://www.plantuml.com/plantuml/png/TLHDQnDH5DtFhxWxMq54bsqf5HG_LWKBkYkfXZPGsnAdYf15FcYw2KPKWYYrj8BkP9maPZfffd_Xl7_aUVVbuOHqkkXxxyvzzvvpxdbPUnsMgk7XgzsWXg_8J1s9QPYcQI56P8vhWV1FSvPrkoGuGOI1QI31c2cVvT76nhfWnEWLBpS50sHoR_snF2o5vRUbTm4cY8Jr4YPDR5KCkIQuaFBUouFzobx8w_C9cNalWOAf4qvgGPcwHhdjsUQvhgQr72Z0MgvphGWoOXOOy6OstKqmbDmnmoN62c9YkX8W5ek9tVkcDULt6Ex8qtBrJUL5sIdZkkVZlZrEzUxG5YUNhWB09Gya9yWiGoHi6LdMw2Chng9Q1aYHQKMgmh0MCXqYqnA9EHB68qqsNSJvb7dchcF0zG_6ZANscyVX1MwG-CBDHHLPENrII4Cx6_9vycnZYla66uuKXXin2uw4vvHGMWJIj8G4wRpNB34FUtPSHMhCMSrDejW7fxQEWcx2MtTE4jEv5Xu529GCWVKzUQsdcXDN8iekrO-H2xIcPZKzxy_YPqQ0txqNLDM2JXTMxkNfozm_SBlTyZPVarGhspkX1bQsLl4HNzZk6txZ5qxG5fmnS8uV-82VQEDuQUNsrghFjlEbrBO_bndBjarFPZs7JF7tSfuh6Eh_7hVaFius7ppVl2CBrwaWxXd6rYlgeLWZrfZco9dLDhnYRbtr7JgrB8OntQ108lNmYC9Zf3Tjwb_lcCLP87S9vDoE9szruX7_ElNOKHYp_3rpRbnDYkz64Apn7tzG_m40" alt=""><figcaption><p>DC_2.1</p></figcaption></figure>

<table><thead><tr><th width="255">ID</th><th>DC_2.2</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Оновлення JWT</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач має дійсний Refresh Token</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримує новий JWT</td></tr></tbody></table>

<figure><img src="https://www.plantuml.com/plantuml/png/TLDFQnDH4B_lfvXZAuZeiIcbekAVKz60tcggQnEiIKctYf13cq1w4ICgLPHOgg0t2MdMhZ7x_0g_zutypNj9DoRT19BtPcVczsTcLtUYKZtQVROLDF09nkuXiVksQLleesSF6e7mut8AxhWawAA7WTr7WZzCUI-tYiKrmIcZVrdS50nWvEhQRRbPYi8NfPS1KlI4_H8cfTeLCLBUVajOVRnTgrGZbiyd6FjQ0aTcZtI6IehqDChZeO9dg7nM21p1nXHo8uyo-cmmOAKPdrB4CdKr635JIQIs8m7wefo8Vc9ROtsxKLdkXVNdbKUXTyQZJyVFu8zSRQpDgQNZ26342yK9Z2f4GiYUgiO9J3wNXGkBPuDuvwAnsgCjKornjjwvNwH7waywApnNu-pKF4g-fKSEJS6RsHRC-cfV2ORpMqKJ0pu-pJYFa8XIDaoFbRMBCC-FsXvEffk_fEJqPUBaEOOKnfjSs_QdhN2JsoVrocOvSe7bZHMynKS2VCPF_40NRS4n0r_n3M_m7MqSB2rVsbYPPEiiQAWYYX9HcXYGK9kJ_Q2OMVf5kNvj_SQ3zSkom7vqJSUFLF1BbvVVZjmDdzJ3dR8KQq_3waFRyiizr3GkNu8-9NSM9zrmhEski5qNiVTO_stJlrd_T_DLbEj51wlyuIl_3m00" alt=""><figcaption><p>DC_2.2</p></figcaption></figure>

### Аутентифікований користувач

<table><thead><tr><th width="255">ID</th><th>DC_3.1</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Аналіз зображення</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Користувач, API Gateway, Auth Service, CV Service</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач вказав дійсний JWT у заголовках HTTP запиту</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Користувач отримує опис зображення</td></tr></tbody></table>

<figure><img src=".gitbook/assets/edited_d_5.png" alt=""><figcaption></figcaption></figure>

### Адміністратор

<table><thead><tr><th width="255">ID</th><th>DC_4.1</th></tr></thead><tbody><tr><td><strong>НАЗВА</strong></td><td>Редагування запису у БД</td></tr><tr><td><strong>УЧАСНИКИ</strong></td><td>Адміністратор, СУБД</td></tr><tr><td><strong>ПЕРЕДУМОВИ</strong></td><td>Користувач має роль адміністратора в СУБД</td></tr><tr><td><strong>РЕЗУЛЬТАТ</strong></td><td>Оновлений запис в таблиці БД</td></tr></tbody></table>

<figure><img src="https://www.plantuml.com/plantuml/png/XP0zJe1058JxFSKxXzjm5HFj_36AtHP0eOq1DGHBDLu04IB-i5vXtesS1njZOwJQVSnyC_koitptD3y_F701rnZngHqMxRJKIWlqMY5g4PpmMvL-FUu8xYaSyOuFhVMImfQ6AzeQuJWARj1wjue37l5az_3ZnKJuX851XJRQ2YAUYUe8Z3OsI6z54kFVSgJUOk6zn6nD1A-R7BDW44fxI-3F2wrJk-HxiF3aicm6VI6c4_ru4wjbEAqsrn_lkYF7NlP2ApT26XOEIanM-rSbdnPwVE9Tjd-qn_r_0m00" alt=""><figcaption><p>DC_4.1</p></figcaption></figure>
