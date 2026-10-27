import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';

interface Transcription {
  id: number;
  title: string;
  content: string;
  language: string;
  createdAt: string;
  updatedAt: string;
}

interface SpeechRecognitionAlternativeLike { transcript: string; }
interface SpeechRecognitionResultLike { isFinal: boolean; [index: number]: SpeechRecognitionAlternativeLike; }
interface SpeechRecognitionEventLike { resultIndex: number; results: ArrayLike<SpeechRecognitionResultLike>; }
interface SpeechRecognitionErrorLike { error: string; }
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private zone = inject(NgZone);
  private api = `${environment.apiUrl}/transcriptions`;
  private recognition: SpeechRecognitionLike | null = null;

  records: Transcription[] = [];
  search = '';
  title = '';
  language = 'hi-IN';
  finalText = '';
  interimText = '';
  status = 'Ready to transcribe';
  error = '';
  isListening = false;
  editingId: number | null = null;
  busy = false;

  ngOnInit(): void { this.load(); }
  ngOnDestroy(): void { this.recognition?.abort(); }

  load(): void {
    this.http.get<Transcription[]>(this.api, { params: { search: this.search } })
      .subscribe({
        next: data => this.records = data,
        error: () => this.error = 'Could not load history. Check that the Spring Boot API and database are running.'
      });
  }

  startListening(): void {
    this.error = '';
    const speechWindow = window as SpeechWindow;
    const SpeechCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechCtor) {
      this.error = 'Speech recognition is unavailable in this browser. Try the latest Chrome or Edge over localhost/HTTPS.';
      return;
    }
    if (this.isListening) return;

    this.finalText = '';
    this.interimText = '';
    this.recognition = new SpeechCtor();
    this.recognition.lang = this.language;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.onresult = (event) => this.zone.run(() => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) this.finalText += transcript + ' ';
        else interim += transcript;
      }
      this.interimText = interim;
    });
    this.recognition.onerror = (event) => this.zone.run(() => {
      this.error = `Speech recognition error: ${event.error}`;
      this.isListening = false;
    });
    this.recognition.onend = () => this.zone.run(() => {
      this.isListening = false;
      this.status = 'Microphone stopped';
    });
    try {
      this.recognition.start();
      this.isListening = true;
      this.status = 'Listening… speak now';
    } catch {
      this.error = 'Could not start microphone recognition. If it is already running, stop it and try again.';
    }
  }

  stopListening(): void {
    this.recognition?.stop();
    this.isListening = false;
    this.status = 'Transcription paused';
  }

  save(): void {
    const content = this.finalText.trim();
    if (!content) {
      this.error = 'Speak something first, or type text into the transcript box.';
      return;
    }
    const body = {
      title: this.title.trim() || `Transcription ${new Date().toLocaleString()}`,
      content,
      language: this.language
    };
    this.busy = true;
    const request = this.editingId === null
      ? this.http.post<Transcription>(this.api, body)
      : this.http.put<Transcription>(`${this.api}/${this.editingId}`, body);
    request.subscribe({
      next: () => {
        this.busy = false;
        this.status = this.editingId === null ? 'Transcription saved' : 'Transcription updated';
        this.resetForm();
        this.load();
      },
      error: () => {
        this.busy = false;
        this.error = 'Save failed. Check the backend connection and try again.';
      }
    });
  }

  edit(item: Transcription): void {
    this.editingId = item.id;
    this.title = item.title;
    this.finalText = item.content;
    this.language = item.language;
    this.interimText = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(item: Transcription): void {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    this.http.delete<void>(`${this.api}/${item.id}`).subscribe({
      next: () => {
        this.status = 'Transcription deleted';
        this.load();
        if (this.editingId === item.id) this.resetForm();
      },
      error: () => this.error = 'Delete failed. Please try again.'
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.title = '';
    this.finalText = '';
    this.interimText = '';
    this.error = '';
  }

  get displayedText(): string { return `${this.finalText}${this.interimText}`.trim(); }
}
