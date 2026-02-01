import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface FloatingHeart {
  id: number;
  left: number;
  delay: number;
  size: number;
}

interface FireworkHeart {
  angle: number;
  distance: number;
  delay: number;
}

interface Firework {
  id: number;
  x: number;
  y: number;
  delay: number;
  hearts: FireworkHeart[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [CommonModule, HttpClientModule]
})
export class App implements OnInit {
  currentMessage = '';
  noButtonTransform = '';
  accepted = false;
  showFireworks = false;
  declineCount = 0;
  showNoButton = true;
  countdown = 5;
  showCountdown = false;
  dramaMode = false;
  countdownInterval: any;
  fakeCursorStyle = { left: '0px', top: '0px', display: 'none' };
  showFakeCursor = false;
  wasAutoClicked = false;
  
  floatingHearts: FloatingHeart[] = [];
  fireworks: Firework[] = [];
  
  private funnyMessages = [
    "Oups t'as du te trompé 😅",
    "Ahah pas de chance de rater 2 fois de suite quand même 😏",
    "Tu crois que tu as le choix enfaite !!!???? APPUIE SUR OUI 😤"
  ];

  private apiUrl = 'http://localhost:5000/api/valentine';

  constructor(
    private http: HttpClient,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.generateFloatingHearts();
    this.loadMessages();
  }

  private loadMessages() {
    this.http.get<any>(`${this.apiUrl}/messages`).subscribe({
      next: (response) => {
        if (response.funnyMessages) {
          this.funnyMessages = response.funnyMessages;
        }
      },
      error: () => {
        // Use default messages if API is not available
        console.log('Using default messages');
      }
    });
  }

  private generateFloatingHearts() {
    for (let i = 0; i < 20; i++) {
      this.floatingHearts.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 5,
        size: 1 + Math.random() * 2
      });
    }
  }

  onNoHover() {
    if (this.declineCount < this.funnyMessages.length) {
      this.moveNoButton();
    }
  }

  onNoClick() {
    if (this.declineCount < this.funnyMessages.length) {
      this.currentMessage = this.funnyMessages[this.declineCount];
      this.declineCount++;
      
      if (this.declineCount >= 3) {
        // Third click - hide No button and start countdown
        this.showNoButton = false;
        this.showCountdown = true;
        this.startCountdown();
      } else {
        this.moveNoButton();
      }

      // Notify API
      this.http.post(`${this.apiUrl}/decline/${this.declineCount - 1}`, {}).subscribe();
    }
  }

  private startCountdown() {
    this.ngZone.runOutsideAngular(() => {
      this.countdownInterval = setInterval(() => {
        this.ngZone.run(() => {
          this.countdown--;
          this.cdr.detectChanges();
          if (this.countdown <= 0) {
            clearInterval(this.countdownInterval);
            this.autoClickYes();
          }
        });
      }, 1000);
    });
  }

  private autoClickYes() {
    // Show fake cursor and animate it to the Yes button
    this.showFakeCursor = true;
    this.currentMessage = "Bon... je vais t'aider alors ! 😏";
    this.cdr.detectChanges();
    
    // Start cursor from bottom right
    const startX = window.innerWidth - 100;
    const startY = window.innerHeight - 100;
    
    this.fakeCursorStyle = {
      left: startX + 'px',
      top: startY + 'px',
      display: 'block'
    };
    this.cdr.detectChanges();
    
    // Small delay then animate to button
    setTimeout(() => {
      // Get the Yes button position
      const yesButton = document.querySelector('.btn-yes') as HTMLElement;
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight / 2;
      
      if (yesButton) {
        const rect = yesButton.getBoundingClientRect();
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }
      
      this.fakeCursorStyle = {
        left: targetX + 'px',
        top: targetY + 'px',
        display: 'block'
      };
      this.cdr.detectChanges();
      
      // Click after cursor reaches button (1.5s transition)
      setTimeout(() => {
        this.showFakeCursor = false;
        this.cdr.detectChanges();
        this.onYesClick(true);
      }, 1600);
    }, 200);
  }

  private moveNoButton() {
    const maxX = 200;
    const maxY = 150;
    const randomX = (Math.random() - 0.5) * maxX * 2;
    const randomY = (Math.random() - 0.5) * maxY * 2;
    this.noButtonTransform = `translate(${randomX}px, ${randomY}px)`;
  }

  onYesClick(isAuto: boolean = false) {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    if (isAuto) {
      this.wasAutoClicked = true;
    }
    this.accepted = true;
    this.showFireworks = true;
    this.showCountdown = false;
    this.dramaMode = false;
    this.cdr.detectChanges();
    this.generateFireworks();

    // Notify API
    this.http.post(`${this.apiUrl}/accept`, {}).subscribe();

    // Continue generating fireworks
    setInterval(() => {
      this.generateFireworks();
    }, 2000);
  }

  private generateFireworks() {
    const newFireworks: Firework[] = [];
    
    for (let i = 0; i < 8; i++) {
      const hearts: FireworkHeart[] = [];
      const numHearts = 12;
      
      for (let j = 0; j < numHearts; j++) {
        hearts.push({
          angle: (360 / numHearts) * j,
          distance: 80 + Math.random() * 60,
          delay: Math.random() * 200
        });
      }
      
      newFireworks.push({
        id: Date.now() + i,
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 80,
        delay: Math.random() * 1000,
        hearts
      });
    }
    
    this.fireworks = [...this.fireworks, ...newFireworks];
    
    // Clean up old fireworks after animation
    setTimeout(() => {
      this.fireworks = this.fireworks.filter(f => !newFireworks.includes(f));
    }, 3000);
  }
}
