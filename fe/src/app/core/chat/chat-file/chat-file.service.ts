import { inject, Injectable } from '@angular/core';
import { Firestore, collection, query, where, getDocs, onSnapshot, addDoc, doc, getDoc, updateDoc, orderBy, Timestamp, deleteField, FieldPath, limit, deleteDoc, collectionData, collectionGroup, startAfter } from '@angular/fire/firestore';
import { uriConfig } from 'app/core/uri/config';
import { HttpClient } from '@angular/common/http';
import { Storage,ref,uploadBytesResumable,getDownloadURL,deleteObject,} from '@angular/fire/storage';
import { catchError, concat, forkJoin, from, map, Observable, of, reduce, switchMap, tap, throwError } from 'rxjs';
import imageCompression from 'browser-image-compression';
import { FileUpload } from '../chat.types';

@Injectable({
  providedIn: 'root'
})
export class ChatFileService {

  constructor() { }
  private _httpClient = inject(HttpClient);
  private _storage = inject(Storage);
  private _fileTasks: Map<string, FileUpload> = new Map();

  uploadFile(files: File[]) {
      const formData = new FormData();
      for (const file of files) {
          formData.append('file', file);
      }
      return this._httpClient.post(uriConfig.API_GET_IMAGE, formData).pipe(
          map((response: any) => {
              console.log('RESPONSE: ', response);
              return response.data.files;
          })
      );
  }

  async compressImage(file: File): Promise<File> {
      console.time(`compressImage-${file.name}`);
      if (!file.type.startsWith('image/') || file.size <= 0.5 * 1024 * 1024) {
          console.timeEnd(`compressImage-${file.name}`);
          return file;
      }

      try {
          const options = {
              maxSizeMB: 0.5,
              maxWidthOrHeight: 800,
              useWebWorker: true,
              initialQuality: 0.6,
          };
          const compressedFile = await imageCompression(file, options);
          console.timeEnd(`compressImage-${file.name}`);
          return compressedFile.size < file.size ? compressedFile : file;
      } catch (error) {
          console.warn('Image compression failed for', file.name, ':', error);
          console.timeEnd(`compressImage-${file.name}`);
          return file;
      }
  }

  generateFileName(file: File, chatRoomId: string): string {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const extension = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      return `${chatRoomId}_${timestamp}_${randomId}_${safeName}`;
  }

  uploadSingleFile(file: File, chatRoomId: string): Observable<string> {
      const fileName = this.generateFileName(file, chatRoomId);
      const filePath = `myimage/${chatRoomId}/${fileName}`;

      return from(this.compressImage(file)).pipe(
          switchMap((compressedFile) => {
              console.time(`uploadSingleFile-${file.name}`);
              const storageRef = ref(this._storage, filePath);
              console.time(`uploadBytesResumable-${file.name}`);
              const uploadTask = uploadBytesResumable(
                  storageRef,
                  compressedFile
              );
              this._fileTasks.set(file.name, {
                  file: compressedFile,
                  uploadTask: uploadTask,
                  status: 'uploading',
                  storageRef: storageRef,
              });

              return new Observable<void>((observer) => {
                  uploadTask.on(
                      'state_changed',
                      () => {},
                      (error) => {
                          observer.error(error);
                      },
                      () => {
                          const fileTask = this._fileTasks.get(file.name);
                          if (fileTask && fileTask.status !== 'canceled') {
                              fileTask.status = 'uploaded';
                              this._fileTasks.set(file.name, fileTask);
                              observer.next();
                              observer.complete();
                          } else {
                              deleteObject(fileTask.storageRef)
                                  .then(() => {
                                      console.log(
                                          `File ${file.name} deleted successfully`
                                      );
                                  })
                                  .catch((error) => {
                                      console.error(
                                          `Error deleting file ${file.name}:`,
                                          error
                                      );
                                  });
                              this._fileTasks.delete(file.name);
                              observer.complete();
                          }
                      }
                  );
              }).pipe(
                  switchMap(() => {
                      console.timeEnd(`uploadBytesResumable-${file.name}`);
                      console.time('getDownloadURL');
                      return from(getDownloadURL(storageRef)).pipe(
                          tap((url) => {
                              const fileTask = this._fileTasks.get(file.name);
                              if (fileTask) {
                                  fileTask.status = 'urlFetched';
                                  fileTask.url = url;
                                  this._fileTasks.set(file.name, fileTask);
                              } else {
                                  deleteObject(storageRef)
                                      .then(() => {
                                          console.log(
                                              `File ${file.name} deleted successfully`
                                          );
                                      })
                                      .catch((error) => {
                                          console.error(
                                              `Error deleting file ${file.name}:`,
                                              error
                                          );
                                      });
                                  this._fileTasks.delete(file.name);
                              }
                              console.timeEnd('getDownloadURL');
                          })
                      );
                  }),
                  catchError((error) => {
                      console.error(`Upload failed for ${file.name}:`, error);
                      return of('');
                  })
              );
          }),
          tap(() => console.timeEnd(`uploadSingleFile-${file.name}`)),
          catchError((error) => {
              console.error(`Error processing ${file.name}:`, error);
              return of('');
          })
      );
  }

  uploadFilesToFirebase(
      files: File[],
      chatRoomId: string
  ): Observable<string[]> {
      if (!files || files.length === 0) {
          return of([]);
      }

      console.log(
          `Starting upload of ${files.length} files to chatroom: ${chatRoomId}`
      );
      console.time(`uploadFilesToFirebase-${chatRoomId}`);

      const validFiles = files.filter((file) => {
          const maxSize = 10 * 1024 * 1024;
          const allowedTypes = [
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/webp',
          ];

          if (file.size > maxSize) {
              console.warn(`File ${file.name} exceeds size limit`);
              return false;
          }

          if (!allowedTypes.includes(file.type)) {
              console.warn(`File ${file.name} has unsupported type`);
              return false;
          }

          return true;
      });

      if (validFiles.length === 0) {
          return throwError(() => new Error('No valid files to upload'));
      }

      const concurrencyLimit = 3;
      const batches: Observable<string[]>[] = [];

      for (let i = 0; i < validFiles.length; i += concurrencyLimit) {
          const batch = validFiles.slice(i, i + concurrencyLimit);
          const batchObservables = batch.map((file) =>
              this.uploadSingleFile(file, chatRoomId)
          );

          batches.push(
              forkJoin(batchObservables).pipe(
                  map((urls) => urls.filter((url) => url && url.length > 0))
              )
          );
      }

      return concat(...batches).pipe(
          reduce((acc, urls) => [...acc, ...urls], [] as string[]),
          tap(() => console.timeEnd(`uploadFilesToFirebase-${chatRoomId}`)),
          tap((results) =>
              console.log(
                  `Upload completed. Success: ${results.length}/${validFiles.length}`
              )
          ),
          catchError((error) => {
              console.error('Upload batch failed:', error);
              return of([]);
          })
      );
  }

  cancelFileUpload(fileName: string): Observable<void> {
      const fileTask = this._fileTasks.get(fileName);
      if (!fileTask || !fileTask.uploadTask) {
          return throwError(
              () => new Error(`No upload task found for file: ${fileName}`)
          );
      }

      console.log(`Cancelling upload for file: ${fileName}`);
      if (fileTask.status === 'uploading') {
          fileTask.uploadTask.cancel();
          this._fileTasks.delete(fileName);
          return of();
      } else if (
          fileTask.status === 'urlFetched' ||
          fileTask.status === 'uploaded'
      ) {
          return from(deleteObject(fileTask.storageRef)).pipe(
              tap(() => {
                  console.log(`File ${fileName} deleted successfully`);
                  this._fileTasks.delete(fileName);
              }),
              catchError((error) => {
                  console.error(`Error deleting file ${fileName}:`, error);
                  return throwError(() => error);
              })
          );
      }

      return new Observable<void>((observer) => {
          observer.next();
          observer.complete();
      });
  }
}
