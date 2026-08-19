export const moduleConfig = {
  Profile: {
    title: 'Profile Module',
    subtitle: 'Manage personal details, bio, and profile setup.',
    actions: ['Add', 'Update'],
    fields: ['name', 'village', 'bio', 'contact_number', 'profile_image'],
    sections: [
      {
        title: 'Representative Documents',
        description: 'Upload and manage representative proof documents.',
        actions: ['Add', 'Update', 'Delete'],
        fields: ['id_card', 'appointment_letter'],
      },
    ],
  },
  'My Network': {
    title: 'Referral / Network',
    subtitle: 'Track referrals, uplines, and your growing network.',
    actions: ['View'],
    fields: ['user_id', 'referred_by', 'level'],
  },
  Wallet: {
    title: 'Wallet Module',
    subtitle: 'View total balance, credits, debits, and transaction records.',
    actions: ['View'],
    fields: ['total_balance', 'credit', 'debit', 'transaction_type', 'date'],
  },
  Withdraw: {
    title: 'Withdraw Module',
    subtitle: 'Request withdrawals and check the approval status.',
    actions: ['Add (request)', 'View status'],
    fields: ['amount', 'bank_name', 'account_number', 'ifsc', 'upi_id', 'status'],
  },
  'Subscription Plans': {
    title: 'Subscription Module',
    subtitle: 'Review available plans, durations, and expiry details.',
    actions: ['View'],
    fields: ['plan_name', 'price', 'duration', 'start_date', 'expiry_date'],
  },
  'News Feed': {
    title: 'News Module',
    subtitle: 'Browse articles, categories, and share important updates.',
    actions: ['View', 'Share'],
    fields: ['title', 'description', 'image/video', 'category', 'date'],
  },
  'e-Paper': {
    title: 'e-Paper Module',
    subtitle: 'Open and download daily e-paper files.',
    actions: ['View', 'Download'],
    fields: ['pdf_file', 'date'],
  },
  'Live Streaming': {
    title: 'Live Streaming Module',
    subtitle: 'Monitor ongoing live sessions and scheduled streams.',
    actions: ['View'],
    fields: ['stream_title', 'stream_url', 'schedule_date', 'host_name', 'status'],
  },
  Certification: {
    title: 'Certification Module',
    subtitle: 'Attempt quizzes, check scores, and download certificates.',
    actions: ['Attempt', 'View', 'Download'],
    fields: ['quiz_id', 'score', 'result', 'certificate_file'],
  },
  Notifications: {
    title: 'Notifications Module',
    subtitle: 'View message alerts, dates, and delivery status.',
    actions: ['View'],
    fields: ['title', 'message', 'date', 'status'],
  },
  Settings: {
    title: 'Settings Module',
    subtitle: 'Update app language and password preferences.',
    actions: ['Update'],
    fields: ['language', 'password'],
  },
};
