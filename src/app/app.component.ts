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
  msg = '';
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
        this.msg = `הפנים מ-${match.label} נמצאו בתמונה`;
        this.src2 = this.faces[match.label];
      } else {
        this.msg = 'לא מצאתי פנים בתמונה';
      }
    }
  }
  
  async uploadImages() {
    const imgFiles = (this.cmp2.nativeElement as HTMLInputElement).files;
    if (imgFiles !== null) {
      console.log(imgFiles);
      const descriptors: any[] = [];
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
      this.src2 = '';
    }
  }
 
  
  // descriptors = new ReplaySubject<Array<faceapi.LabeledFaceDescriptors>>();
  // videoStream: MediaStream;
  // matcher: faceapi.FaceMatcher | null = null;
  // ppl: any = {};

  // constructor(private http: HttpClient) {
  //   http.get('assets/descriptors.json').subscribe((descriptors: any) => {
  //     const mapping: any = {};
  //     descriptors.forEach((descriptor: any) => {
  //       const label = descriptor.label;
  //       if (!mapping[label]) {
  //         mapping[label] = [];
  //         mapping[label].push(Float32Array.from(descriptor.descriptor));
  //       }
  //     });
  //     this.descriptors.next(Object.keys(mapping).map((label: any) => {
  //       return new faceapi.LabeledFaceDescriptors(label, mapping[label]);
  //     }));
  //     this.descriptors.complete();
  //   });
  // }

  async loadModels() {
    // await faceapi.loadTinyFaceDetectorModel('assets/models');
    await faceapi.loadSsdMobilenetv1Model('assets/models');
    await faceapi.loadFaceDetectionModel('assets/models');
    await faceapi.loadFaceLandmarkModel('assets/models');  
    await faceapi.loadFaceRecognitionModel('assets/models');
  }
  
  ngAfterViewInit(): void {
    defer(async () => this.init()).subscribe(() => {
      console.log('initialized');
      this.inited = true;
    });
  }

  async init() {
    await this.loadModels();
    // this.descriptors.subscribe((descriptors) => {
    //   this.matcher = new faceapi.FaceMatcher(descriptors);
    // });
  }

  // faceDetect() {
  //   const videoEl: HTMLVideoElement = this.inputVideo.nativeElement;
  //   const overlayEl: HTMLCanvasElement = this.overlay.nativeElement;

  //   // const minConfidence = 0.5;
  //   const options = new faceapi.TinyFaceDetectorOptions({inputSize: 256});
  //   const textOptions: faceapi.draw.IDrawTextFieldOptions = {fontSize: 30, anchorPosition: faceapi.draw.AnchorPosition.TOP_RIGHT, fontStyle: 'Open Sans'};

  //   defer(async () => await faceapi.detectAllFaces(videoEl, options).withFaceLandmarks().withAgeAndGender().withFaceDescriptors()).pipe(
  //   ).subscribe((results) => {
  //     if (results.length > 0) {
  //       const dims = faceapi.matchDimensions(overlayEl, videoEl, true);
  //       const resizedResults = faceapi.resizeResults(results, dims);
  //       faceapi.draw.drawFaceLandmarks(overlayEl, resizedResults as any);  

  //       const ppl: any = {};

  //       for (const result of resizedResults) {
  //         const { age, gender, genderProbability } = result as any;
  //         const hebGender = gender === 'male' ? 'בן' : 'בת';
  //         let bestMatch = null;
  //         if (this.matcher) {
  //           bestMatch = this.matcher.findBestMatch(result.descriptor);
  //           const text: string[] = [];
  //           if (bestMatch.label && bestMatch.label !== 'unknown') {
  //             text.push(bestMatch.label);
  //             ppl[bestMatch.label] = this.ppl[bestMatch.label] || {ages: [], male: []};
  //             ppl[bestMatch.label].ages = [age, ...ppl[bestMatch.label].ages.slice(0, 30)];
  //             const isMale = gender === 'male' ? genderProbability : 1 - genderProbability;
  //             ppl[bestMatch.label].male = [isMale, ...ppl[bestMatch.label].male.slice(0, 30)];
  //           } else {
  //             text.push(`${hebGender} ~${faceapi.utils.round(age, 0)}`);
  //           }
  //           let labelPosition = result.detection.box.topRight.mul(new Point(2,2));
  //           labelPosition = labelPosition.add(result.detection.box.topLeft).div(new Point(3, 3));
  //           labelPosition = labelPosition.sub(new Point(0, result.detection.box.height*0.5));
  //           new faceapi.draw.DrawTextField(text, labelPosition, textOptions).draw(overlayEl);
  //           const known: string[] = [];
  //           Object.keys(ppl).sort().forEach((name: string) => {
  //             const ages = ppl[name].ages;
  //             const male = ppl[name].male;
  //             const avgAge = ages.reduce((total: number, a: number) => total + a) / ages.length;
  //             const avgMale = male.reduce((total: number, a: number) => total + a) / male.length;
  //             known.push(`${name}: ${avgMale > 0.5 ? 'בן' : 'בת'} ${avgAge.toFixed(0)}`);
  //           });
  //           if (known.length > 0) {
  //             new faceapi.draw.DrawTextField(known,
  //               new Point(overlayEl.width, 0), textOptions
  //             ).draw(overlayEl);
  //           }
  //           this.ppl = ppl;
  //         }
  //       }
  //     } else {
  //       const context = overlayEl.getContext('2d');
  //       context?.clearRect(0, 0, overlayEl.width, overlayEl.height);
  //     }
  //     requestAnimationFrame(() => this.faceDetect());
  //   });
    
  // }
}
