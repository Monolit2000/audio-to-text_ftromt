import { Subscription } from 'rxjs';
import { ChatDto } from './chat-dto';
import { FormsModule } from '@angular/forms'; 
import { CommonModule } from '@angular/common';
import { ChatTitelDto } from './chat-titel-dto';
import { SharedService } from '../services/shared.service';
import { ChatResponse } from '../chat/chat-response.model';
import { ChatService } from '../services/chat-service.service';
import { ChatWithChatResponseDto } from './chat-with-chat-response-dto';
import { Component, Input, SimpleChanges, Output, ElementRef, EventEmitter, ViewChild, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent {
 
  loading = false;
  chatId = 'your-chat-id'; 
  promptText = '';
  test = true;
  responses:  ChatResponse[] = []; 
  selectedFile: File | null = null;
  currentSubscription: Subscription | null = null;
  testMoode = 'Generate text';
  aIMoode = 'AI chat';
  currentResponseHandle = false
  index: number = -1

  currentMode: string = this.testMoode;
 
  generationLoading = false;

  constructor(
    private chatService: ChatService,
    private sharedService: SharedService,
    private cdr: ChangeDetectorRef) {}

  @Input() currentChatId: string | null = null;

  @Output() chatCreated = new EventEmitter<ChatDto>();

  @ViewChild('responseContainer') responseContainer!: ElementRef;

  setMode(mode: string): void {
    this.currentMode = mode;
  }

  ngOnInit(): void {
    this.sharedService.getData<string>('createChat').subscribe((data)  => {
      this.responses = [];
      this.loading = false;
      return;
    })
  }

  private scrollToBottom(delay: number = 0) {
    try {
      // Устанавливаем таймер (если delay > 0)
      setTimeout(() => {
        this.responseContainer.nativeElement.scrollTo({
          top: this.responseContainer.nativeElement.scrollHeight,
          behavior: 'smooth',
        });
      }, delay);
    } catch (err) {
      console.error('Error while scrolling:', err);
    }
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentChatId'] && changes['currentChatId'].currentValue) {
      console.log('Chat ID changed to:', changes['currentChatId'].currentValue);
      this.loading = true;
      this.chatId = changes['currentChatId'].currentValue;

      if(this.chatId === 'n'){
        this.responses = [];
        this.loading = false;
        return;
      }

      this.chatService.getAllChatResponsesByChatId(this.currentChatId!).subscribe({
        next: (responses: ChatResponse[]) => {
          this.responses = responses; 
          this.loading = false;
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error fetching chat responses:', error);
          this.loading = false;
        }
      });
    }
  }

  cancelChatResponse() {
    if (this.currentSubscription) {
      this.currentSubscription.unsubscribe();
      this.currentSubscription = null;
      console.log('Streaming canceled');
      this.generationLoading = false;
    }else{
      console.log('Streaming canceleddfsagdfagfsdgsfgedfgdsfgds');
      this.generationLoading = false;
    }
  }

  createChatWithChatResponse(){
    if (this.selectedFile) 
        this.loading = true;
        let prompt = this.currentMode !== this.testMoode ? '@' + this.promptText.trim() : this.promptText;
        this.promptText = '';
        this.generationLoading = true;
        this.currentSubscription = this.chatService.createStreamingChatWithChatResponse(prompt, this.selectedFile).subscribe({
          next: (response: ChatWithChatResponseDto) => {
            console.log('Audio prompt sent successfully', response);
            this.chatId = response.chatDto.chatId;

            let chatResponse: ChatResponse ={
              chatId : response.chatDto.chatId,
              prompt: response.prompt,
              conetent : response.conetent
            }

            // this.responses.push(chatResponse); 
            // this.hendleStreameResponce(chatResponse);

            if (this.currentResponseHandle === false) {
              this.responses.push(chatResponse);
              this.index = this.responses.findIndex(r => r === chatResponse);
              this.currentResponseHandle = true;
              this.scrollToBottom();

              this.sharedService.sendObject(response.chatDto)
              this.geneareteChatTitel(response.chatDto.chatId, response.prompt);
            } else {
        
              if (this.index !== -1) {
                this.responses[this.index].conetent += response.conetent;
              }
            }
            this.cdr.detectChanges();
            // this.chatCreated.emit(response.chatDto);
            this.selectedFile = null;
            this.loading = false;
            this.scrollToBottom()
            
          },
          error: (error) => {
            console.error('Error during the HTTP request:', error);
            this.loading = false;
            this.generationLoading = false;
            this.cdr.detectChanges();
          },
          complete: () => {
            console.log('Streaming complete');
            this.generationLoading = false; // Завершаем индикацию загрузки
            this.cdr.detectChanges();
          }
      });
      this.currentResponseHandle = false;
}

  onTextSubmit() {
    if (this.promptText.trim()) {
      let prompt = this.currentMode !== this.testMoode ? '@' + this.promptText.trim() : this.promptText;
      this.promptText = '';
      this.generationLoading = true;

      this.currentSubscription = this.chatService.streamChatResponses(this.chatId, prompt).subscribe({
        next: (response: ChatResponse) => {
          this.hendleStreameResponce(response);
        },
        error: (error) => {
          this.generationLoading = false;
          this.cdr.detectChanges();
          console.error('Error:', error)
        },

        complete: () => { // Обработчик завершения
          console.log('Streaming complete');
          this.generationLoading = false; // Завершаем индикацию загрузки
          this.cdr.detectChanges();
        }
     });
    }
      this.currentResponseHandle = false;
  }


  hendleStreameResponce(response: ChatResponse){
    if (this.currentResponseHandle === false) {
      this.responses.push(response);
      this.index = this.responses.findIndex(r => r === response);
      this.currentResponseHandle = true;
      this.scrollToBottom();
    } else {

      if (this.index !== -1) {
        this.responses[this.index].conetent += response.conetent;
        this.generationLoading = true;
      }
    }
    this.cdr.detectChanges();
  }


  geneareteChatTitel(chatId: string, prompt: string){
    this.chatService.geneareteChatTitel(chatId, prompt).subscribe(
      (chatTitelDto: ChatTitelDto) => {
        this.sharedService.sendData<ChatTitelDto>('ChatTitelDto',chatTitelDto);
      },
      (error) => {
        console.error('GeneareteChatTitel:', error)
      }
    );
  }


  onFileSelected(event: any) {
    if(this.selectedFile !== null){
      this.selectedFile = null
    }
    else{
      this.selectedFile = event.target.files[0];
    }
  }

  onAudioSubmit() {
    if(this.responses.length === 0){
      this.createChatWithChatResponse();
      return;
    }

    if (this.selectedFile) {
        this.loading = true;
        this.chatService.sendAudioPrompt(this.chatId, this.selectedFile, this.promptText).subscribe({

        next: (response: ChatResponse) => {
          console.log('Audio prompt sent successfully', response);
          this.responses.push(response); 
          this.selectedFile = null;
          this.loading = false;
          this.promptText = '';
          this.scrollToBottom()
        },
        error: (error) => {
          console.error('Error during the HTTP request:', error);
          this.loading = false;
        }
      });
    }
    else if(this.selectedFile === null && this.promptText !== ''){
      this.onTextSubmit();
    }
  }
}