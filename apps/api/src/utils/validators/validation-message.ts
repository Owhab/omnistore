export class ValidationMessages {
  static maxLength(label: string, max: number): string {
    return `${label} must be maximum ${max} characters long`;
  }

  static minLength(label: string, min: number): string {
    return `${label} must be minimum ${min} characters long`;
  }
}
