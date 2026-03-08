export const CURRENCY_GROUPS = [
    {
      region: '🌍 Globales',
      currencies: [
        { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
        { code: 'EUR', flag: '🇪🇺', name: 'Euro' },
        { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
        { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' },
      ]
    },
    {
      region: '🌎 Norteamérica',
      currencies: [
        { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
        { code: 'MXN', flag: '🇲🇽', name: 'Mexican Peso' },
      ]
    },
    {
      region: '🌎 Sudamérica',
      currencies: [
        { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real' },
        { code: 'CLP', flag: '🇨🇱', name: 'Chilean Peso' },
        { code: 'COP', flag: '🇨🇴', name: 'Colombian Peso' },
        { code: 'PEN', flag: '🇵🇪', name: 'Peruvian Sol' },
        { code: 'ARS', flag: '🇦🇷', name: 'Argentine Peso' },
        { code: 'BOB', flag: '🇧🇴', name: 'Bolivian Boliviano' },
      ]
    },
    {
      region: '🌏 Asia Oriental',
      currencies: [
        { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
        { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan' },
        { code: 'KRW', flag: '🇰🇷', name: 'South Korean Won' },
        { code: 'HKD', flag: '🇭🇰', name: 'Hong Kong Dollar' },
        { code: 'TWD', flag: '🇹🇼', name: 'Taiwan Dollar' },
      ]
    },
    {
      region: '🌏 Sudeste Asiático',
      currencies: [
        { code: 'SGD', flag: '🇸🇬', name: 'Singapore Dollar' },
        { code: 'THB', flag: '🇹🇭', name: 'Thai Baht' },
        { code: 'VND', flag: '🇻🇳', name: 'Vietnamese Dong' },
        { code: 'IDR', flag: '🇮🇩', name: 'Indonesian Rupiah' },
        { code: 'MYR', flag: '🇲🇾', name: 'Malaysian Ringgit' },
        { code: 'PHP', flag: '🇵🇭', name: 'Philippine Peso' },
        { code: 'MMK', flag: '🇲🇲', name: 'Myanmar Kyat' },
        { code: 'KHR', flag: '🇰🇭', name: 'Cambodian Riel' },
        { code: 'LAK', flag: '🇱🇦', name: 'Lao Kip' },
      ]
    },
    {
      region: '🌏 Asia del Sur',
      currencies: [
        { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
        { code: 'NPR', flag: '🇳🇵', name: 'Nepalese Rupee' },
        { code: 'LKR', flag: '🇱🇰', name: 'Sri Lankan Rupee' },
      ]
    },
    {
      region: '🌍 Medio Oriente',
      currencies: [
        { code: 'TRY', flag: '🇹🇷', name: 'Turkish Lira' },
        { code: 'ILS', flag: '🇮🇱', name: 'Israeli Shekel' },
      ]
    },
    {
      region: '🌍 África',
      currencies: [
        { code: 'MAD', flag: '🇲🇦', name: 'Moroccan Dirham' },
        { code: 'ZAR', flag: '🇿🇦', name: 'South African Rand' },
        { code: 'EGP', flag: '🇪🇬', name: 'Egyptian Pound' },
      ]
    },
    {
      region: '🌍 Europa del Este',
      currencies: [
        { code: 'CZK', flag: '🇨🇿', name: 'Czech Koruna' },
        { code: 'HUF', flag: '🇭🇺', name: 'Hungarian Forint' },
        { code: 'PLN', flag: '🇵🇱', name: 'Polish Zloty' },
        { code: 'RON', flag: '🇷🇴', name: 'Romanian Leu' },
      ]
    },
    {
      region: '🌏 Oceanía',
      currencies: [
        { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
        { code: 'NZD', flag: '🇳🇿', name: 'New Zealand Dollar' },
      ]
    },
  ]
  
  // Lista plana para cuando necesites iterar todas
  export const CURRENCIES = CURRENCY_GROUPS.flatMap(g => g.currencies)
  
  // Helpers
  export const CURRENCY_MAP = Object.fromEntries(CURRENCIES.map(c => [c.code, c]))
  export const getFlag = (code) => CURRENCY_MAP[code]?.flag || '💱'
  export const getName = (code) => CURRENCY_MAP[code]?.name || code
  
  // Monedas sin decimales
  const NO_DECIMALS = ['CLP', 'COP', 'JPY', 'KRW', 'VND', 'IDR', 'MMK', 'KHR', 'LAK', 'HUF', 'TWD', 'BOB']
  
  // Formatea un número según la moneda
  export const formatAmount = (amount, code) => {
    if (!amount && amount !== 0) return ''
    const decimals = NO_DECIMALS.includes(code) ? 0 : 2
    return new Intl.NumberFormat('es-CL', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount)
  }