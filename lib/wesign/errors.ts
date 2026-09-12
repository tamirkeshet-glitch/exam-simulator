export class WeSignApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly resultCode?: number,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = "WeSignApiError";
  }
}

// Messages for the ResultCode values documented in the WeSign 4.0.0 changelog (section 3.7 / 5.1.a).
const RESULT_CODE_MESSAGES: Record<number, string> = {
  154: "תמונה במסמך חורגת ממגבלת הרזולוציה",
  155: "ערך מיתוג אימייל לא תקין",
  161: "חתימה בכרטיס חכם מחייבת את יישום הדסקטופ",
  162: "חתימה בכרטיס חכם אינה כלולה בתוכנית",
  163: "הקובץ חורג מהגודל המותר להעלאה",
  164: "מספר הטלפון כבר משויך למשתמש אחר",
  165: "המסמך אינו זמין יותר לחתימה",
  166: "שליחת קוד ה-OTP נכשלה",
};

export function describeResultCode(resultCode?: number): string | undefined {
  if (resultCode === undefined) return undefined;
  return RESULT_CODE_MESSAGES[resultCode];
}
