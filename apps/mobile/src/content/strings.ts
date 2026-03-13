// =============================================================================
// Fina — UI Copy / Content Strings
//
// ALL user-facing text lives here. To update copy, edit this file only —
// no component knowledge required.
// =============================================================================

export const strings = {
  // --------------------------------------------------------------------------
  // App-wide
  // --------------------------------------------------------------------------
  app: {
    name:    'Fina',
    tagline: 'Your personal finance advisor',
  },

  // --------------------------------------------------------------------------
  // Auth screens
  // --------------------------------------------------------------------------
  auth: {
    login: {
      title:              'Welcome back',
      subtitle:           'Sign in to continue to Fina',
      emailLabel:         'Email address',
      emailPlaceholder:   'you@example.com',
      passwordLabel:      'Password',
      passwordPlaceholder:'••••••••',
      submitButton:       'Sign in',
      noAccount:          "Don't have an account?",
      registerLink:       'Create one',
      forgotPassword:     'Forgot password?',
    },
    register: {
      title:              'Create account',
      subtitle:           'Start your financial journey',
      nameLabel:          'Full name',
      namePlaceholder:    'Jane Doe',
      emailLabel:         'Email address',
      emailPlaceholder:   'you@example.com',
      passwordLabel:      'Password',
      passwordPlaceholder:'Min. 8 characters',
      submitButton:       'Create account',
      hasAccount:         'Already have an account?',
      loginLink:          'Sign in',
    },
  },

  // --------------------------------------------------------------------------
  // Tab bar labels
  // --------------------------------------------------------------------------
  tabs: {
    dashboard:    'Home',
    transactions: 'Transactions',
    goals:        'Goals',
    challenge:    'Challenge',
  },

  // --------------------------------------------------------------------------
  // Dashboard screen
  // --------------------------------------------------------------------------
  dashboard: {
    greeting:         'Good morning',
    greetingEvening:  'Good evening',
    insightsTitle:    'AI Insights',
    insightsEmpty:    'Add some transactions to get personalised insights.',
    weeklyLabel:      'Weekly',
    monthlyLabel:     'Monthly',
    totalSpent:       'Total spent',
    totalIncome:      'Total income',
    recentActivity:   'Recent activity',
    viewAll:          'View all',
    refreshInsights:  'Refresh insights',
    loadingInsights:  'Analysing your spending…',
  },

  // --------------------------------------------------------------------------
  // Transactions screen
  // --------------------------------------------------------------------------
  transactions: {
    title:          'Transactions',
    empty:          'No transactions yet. Tap + to add one.',
    addButton:      'Add transaction',
    filterAll:      'All',
    filterIncome:   'Income',
    filterExpense:  'Expenses',
    loadingMore:    'Loading more…',
  },

  // --------------------------------------------------------------------------
  // Add transaction screen
  // --------------------------------------------------------------------------
  addTransaction: {
    title:                'Add transaction',
    descriptionLabel:     'Description',
    descriptionPlaceholder: 'e.g. Coffee at Starbucks',
    amountLabel:          'Amount',
    amountPlaceholder:    '0.00',
    typeLabel:            'Type',
    typeIncome:           'Income',
    typeExpense:          'Expense',
    categoryLabel:        'Category',
    categoryAuto:         'Auto-detect (AI)',
    dateLabel:            'Date',
    submitButton:         'Save transaction',
    aiCategorisingLabel:  'AI is categorising…',
    successMessage:       'Transaction added!',
  },

  // --------------------------------------------------------------------------
  // Goals screen
  // --------------------------------------------------------------------------
  goals: {
    title:                'Goals',
    empty:                "You haven't set any goals yet.",
    addButton:            'New goal',
    descriptionLabel:     'What are you saving for?',
    descriptionPlaceholder: 'e.g. Emergency fund, vacation…',
    targetLabel:          'Target amount',
    targetPlaceholder:    '0.00',
    deadlineLabel:        'Target date (optional)',
    submitButton:         'Create goal',
    aiRecommendationTitle:'AI Recommendation',
    loadingRecommendation:'Getting your personalised recommendation…',
  },

  // --------------------------------------------------------------------------
  // Challenge screen
  // --------------------------------------------------------------------------
  challenge: {
    title:           'Weekly Challenge',
    subtitle:        'Your AI-generated challenge for this week',
    empty:           'No active challenge. Generate one to get started.',
    generateButton:  'Generate challenge',
    generating:      'Creating your challenge…',
    markComplete:    'Mark as complete',
    markFailed:      'Give up',
    statusActive:    'In progress',
    statusCompleted: 'Completed 🎉',
    statusFailed:    'Not completed',
    weekLabel:       'This week',
  },

  // --------------------------------------------------------------------------
  // Shared / common
  // --------------------------------------------------------------------------
  common: {
    loading:       'Loading…',
    error:         'Something went wrong. Please try again.',
    retry:         'Try again',
    cancel:        'Cancel',
    save:          'Save',
    delete:        'Delete',
    confirm:       'Confirm',
    back:          'Back',
    close:         'Close',
    currency:      '$',
    or:            'or',
  },

  // --------------------------------------------------------------------------
  // Error messages
  // --------------------------------------------------------------------------
  errors: {
    requiredField:      'This field is required',
    invalidEmail:       'Enter a valid email address',
    passwordTooShort:   'Password must be at least 8 characters',
    invalidAmount:      'Enter a valid amount greater than 0',
    loginFailed:        'Invalid email or password',
    registerFailed:     'Could not create account. Try again.',
    networkError:       'No connection. Check your internet and try again.',
    sessionExpired:     'Your session expired. Please sign in again.',
  },
} as const;

// Type helper for deep key access — useful if you build an i18n adapter later
export type Strings = typeof strings;
