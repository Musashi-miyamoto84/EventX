export const uk = {
  brand: 'Eventoly',

  auth: {
    emailLabel: 'Електронна адреса',
    emailPlaceholder: 'email@example.com',
    passwordLabel: 'Пароль',
    passwordPlaceholder: 'Мінімум 8 символів',
    confirmPasswordLabel: 'Підтвердіть пароль',
    signIn: 'Увійти через Email',
    signUp: 'Зареєструватися',
    signInTitle: 'Увійти',
    signUpTitle: 'Реєстрація',
    or: 'або',
    googleSignIn: 'Швидкий вхід через Google',
    terms: 'Реєстрація означає згоду з нашими Умовами використання',
    noAccount: 'Немає облікового запису?',
    hasAccount: 'Вже маєте обліковий запис?',
    createAccount: 'Створити обліковий запис',
    forgotPassword: 'Забули пароль?',
    resetPassword: 'Скинути пароль',
    resetSent: 'Посилання для відновлення надіслано на вашу пошту',
    magicLinkSent: 'Посилання для входу надіслано на вашу пошту',
    usePassword: 'Увійти з паролем',
    useMagicLink: 'Увійти без пароля',
    loading: 'Завантаження...',
    logout: 'Вийти',
    verifyEmail: 'Перевірте пошту для підтвердження облікового запису',
  },

  dashboard: {
    welcome: 'Вітаємо!',
    emptyTitle: 'Збирайте фото ваших гостей',
    emptyDescription:
      'Створіть першу подію та дозвольте гостям легко ділитися фото через QR-код.',
    createEvent: 'Створити подію',
    yourEvents: 'Ваші події',
    home: 'Головна',
    templates: 'Шаблони',
    album: 'Альбом',
    settings: 'Налаштування',
    account: 'Обліковий запис',
    loginDetails: 'Дані для входу',
    signedInAs: 'Ви увійшли як:',
  },

  errors: {
    invalidEmail: 'Введіть коректну електронну адресу',
    passwordTooShort: 'Пароль має містити щонайменше 8 символів',
    passwordsMismatch: 'Паролі не співпадають',
    generic: 'Щось пішло не так. Спробуйте ще раз.',
    userExists: 'Користувач з цією поштою вже існує',
    invalidCredentials: 'Невірна пошта або пароль',
    network: 'Помилка мережі. Перевірте з\'єднання.',
    identityNotEnabled:
      'Netlify Identity не активовано. Увімкніть Identity у налаштуваннях сайту на Netlify.',
  },
} as const

export type UkKeys = typeof uk
