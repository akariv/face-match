import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { defer, tap, fromEvent, ReplaySubject, switchMap } from 'rxjs';
import * as faceapi from 'face-api.js';
import { Point } from 'face-api.js';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent implements AfterViewInit {

  @ViewChild('cmp1') cmp1: ElementRef;
  @ViewChild('cmp1img') cmp1img: ElementRef;
  @ViewChild('cmp2') cmp2: ElementRef;
  @ViewChild('cmp2img') cmp2img: ElementRef;
  src1: string;
  src2: string;
  matcher: faceapi.FaceMatcher;
  inited = false;
  msg1 = '';
  msg2 = 'מאתחל...';
  faces: any = {};

  constructor() {}

  async uploadImage() {
    const imgFile = (this.cmp1.nativeElement as HTMLInputElement)?.files?.[0] as File;
    if (imgFile) {
      const img = await faceapi.bufferToImage(imgFile);
      this.src1 = img.src;
      const resultsRef = await faceapi.detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
      if (resultsRef) {
        const match = this.matcher.findBestMatch(resultsRef.descriptor);
        this.msg1 = `נמצאו בתמונה פנים מ: ${match.label}`;
        this.src2 = this.faces[match.label];
      } else {
        this.msg1 = 'לא מצאתי פנים בתמונה';
      }
    }
  }
  
  async uploadImages() {
    const imgFiles = (this.cmp2.nativeElement as HTMLInputElement).files;
    if (imgFiles !== null) {
      console.log(imgFiles);
      const descriptors: any[] = [];
      this.msg2 = 'טוען';
      for (let i = 0 ; i < imgFiles.length ; i++) {
        const imgFile = imgFiles[i] as File;
        const img = await faceapi.bufferToImage(imgFile);
        const resultsRef = await faceapi.detectAllFaces(img)
            .withFaceLandmarks()
            .withFaceDescriptors();
        if (resultsRef.length) {
          descriptors.push(new faceapi.LabeledFaceDescriptors(
            imgFile.name,
            resultsRef.map(x => x.descriptor)
          ));
          console.log(img);
          this.src2 = img.src;  
          this.faces[imgFile.name] = img.src;
        }
        this.matcher = new faceapi.FaceMatcher(descriptors);
      }
      this.msg2 = 'מוכן להשוואה';
      this.msg1 = 'לא נבחרה תמונה';
      this.src2 = '';
    }
  }
 

  async loadModels() {
    await faceapi.loadSsdMobilenetv1Model('assets/models');
    await faceapi.loadFaceDetectionModel('assets/models');
    await faceapi.loadFaceLandmarkModel('assets/models');  
    await faceapi.loadFaceRecognitionModel('assets/models');
  }
  
  ngAfterViewInit(): void {
    defer(async () => this.init()).subscribe(() => {
      console.log('initialized');
      this.inited = true;
      this.msg2 = 'מוכן';
    });
  }

  async init() {
    await this.loadModels();
  }
}
