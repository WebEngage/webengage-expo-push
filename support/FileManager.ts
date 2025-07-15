import * as fs from "fs";
import * as path from "path";
import { WebEngageLog } from "./WebEngageLog";
/**
 * FileManager contains static *awaitable* file-system functions
 */
export class FileManager {
  static async readFile(path: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(path, "utf8", (err, data) => {
        if (err || !data) {
          WebEngageLog.error("Couldn't read file:" + path);
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  static async writeFile(path: string, contents: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path, contents, "utf8", (err) => {
        if (err) {
          WebEngageLog.error("Couldn't write file:" + path);
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  static dirExists(path: string): boolean {
    return fs.existsSync(path);
  }

  static isFile(filePath: string): boolean {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  }

  static isDirectory(dirPath: string): boolean {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  }

  static async copyFile(src: string, dest: string): Promise<void> {
    if (!FileManager.isFile(src)) {
      WebEngageLog.error("Cannot copy, not a file: " + src);
      throw new Error("Path is not a file: " + src);
    }
    const fileContents = await FileManager.readFile(src);
    await FileManager.writeFile(dest, fileContents);
  }

  /**
   * Recursively copies a directory and its contents.
   * @param src Source directory
   * @param dest Destination directory
   */
  static async copyDirectory(src: string, dest: string): Promise<void> {
    if (!FileManager.isDirectory(src)) {
      throw new Error("Source is not a directory: " + src);
    }

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      const srcPath = path.join(src, entry);
      const destPath = path.join(dest, entry);

      if (FileManager.isDirectory(srcPath)) {
        await FileManager.copyDirectory(srcPath, destPath);
      } else if (FileManager.isFile(srcPath)) {
        await FileManager.copyFile(srcPath, destPath);
      }
    }
  }
}
