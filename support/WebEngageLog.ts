export class WebEngageLog {
  static log(str: string) {
    console.log(`\twebengage-expo-push: ${str}`);
  }

  static error(str: string) {
    console.error(`\twebengage-expo-push: ${str}`);
  }
}
