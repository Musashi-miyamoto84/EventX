export const uk = {
  brand: 'Eventoly',

  auth: {
    loginLabel: 'Логін',
    loginPlaceholder: 'ваш_логін',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Мінімум 8 символів',
    confirmPasswordLabel: 'Підтвердіть пароль',
    signIn: 'Увійти',
    signUp: 'Зареєструватися',
    signInTitle: 'Увійти',
    signUpTitle: 'Реєстрація',
    signUpDescription: 'Створіть обліковий запис організатора',
    noAccount: 'Немає облікового запису?',
    hasAccount: 'Вже маєте обліковий запис?',
    createAccount: 'Створити обліковий запис',
    loading: 'Завантаження...',
    logout: 'Вийти',
  },

  dashboard: {
    welcome: 'Вітаємо!',
    emptyTitle: 'Збирайте фото ваших гостей',
    emptyDescription:
      'Створіть першу подію та дозвольте гостям легко ділитися фото через QR-код.',
    createEvent: 'Створити подію',
    home: 'Головна',
    templates: 'Шаблони',
    album: 'Альбом',
    settings: 'Налаштування',
    account: 'Обліковий запис',
    loginDetails: 'Дані для входу',
    signedInAs: 'Ви увійшли як:',
  },

  errors: {
    invalidLogin: 'Логін: 3–32 символи (літери, цифри, . _ -)',
    passwordTooShort: 'Пароль має містити щонайменше 8 символів',
    passwordsMismatch: 'Паролі не співпадають',
    generic: 'Щось пішло не так. Спробуйте ще раз.',
    userExists: 'Користувач з таким логіном уже існує',
    invalidCredentials: 'Невірний логін або пароль',
    network: "Помилка мережі. Перевірте з'єднання.",
  },
} as const
