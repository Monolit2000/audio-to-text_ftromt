import { Component, EventEmitter, Output, HostListener  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { ChatService } from '../services/chat-service.service';
import { ChatDto } from '../chat/chat-dto';


@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.scss'
})
export class ChatListComponent {
  constructor(private chatService: ChatService) {}

  @Output() chatSelected = new EventEmitter<string>();

  
  titel = "";
  selectedChat: ChatDto | null = null;
  hoveredChatId: string | null = null;
  actionMenuChatId: string | null = null;

  chatDtos: ChatDto[] = [];

  ngOnInit(): void {
    this.loadChats();
  }

  loadChats(): void {
    this.chatService.getAllChats().subscribe({
      next: (data) => {
        this.chatDtos = data;
      },
      error: (error) => {
        console.error('Error loading chats:', error);
      },
    });
  }


  selectChat(chatId: string) {
    this.chatSelected.emit(chatId);
   
  }

  onChatSelected(name: string){
    this.titel = name;
  }


  createChat(): void {
    this.chatService.createNewChat().subscribe({
      next: (response) => {
        console.log('Chat created successfully:', response);
        this.chatDtos.unshift(response);
        this.chatSelected.emit(response.chatId);
        this.selectedChat = response;
      },
      error: (error) => {
        console.error('Error creating chat:', error);
      },
    });
  }


  handleChatClick(chat: ChatDto ): void {
    this.selectChat(chat.chatId);
    this.onChatSelected(chat.chatTitel);
    this.selectedChat = chat;
    this.hoveredChatId = chat.chatId
  }


  hoveredChatsId: string[] = [];
  // actionMenuChatsId: string[] = [];

  onActionMenuClick(event: MouseEvent, chat: ChatDto): void {
    event.stopPropagation();
       this.actionMenuChatId = chat.chatId;
  }
  
  handleMouseEnter(chatId: string): void {
    this.hoveredChatId = chatId;
  }

  handleMouseLeave(chatId: string): void {
    if (this.actionMenuChatId !== chatId) {
      this.hoveredChatId = null;
    }
  }

  // Обработчик наведения мыши на меню
  handleMenuMouseEnter(chatId: string): void {
    // Не скрывать меню, когда курсор на меню
    this.hoveredChatId = chatId;
  }

  // Обработчик ухода мыши с меню
  handleMenuMouseLeave(chatId: string): void {
    // Скрываем меню только если курсор ушел с самого меню
    if (this.hoveredChatId === chatId) {
      this.hoveredChatId = null;
    }
  }

  deleteChat(chatId: string): void {
    this.chatService.deleteChat(chatId).subscribe({
      next: () => {
        console.log('Chat deleted successfully');
  
        // Найти индекс удаляемого чата

        //         
         const index = this.chatDtos.findIndex(chat => chat.chatId === chatId);
        if (index === -1) {
          this.selectedChat = null;
          return;
        }
        
        // // Удалить чат из списка
        // this.chatDtos.splice(index, 1);


          this.chatDtos = this.chatDtos.filter(c => c.chatId !== chatId);

          if(this.selectedChat?.chatId !== chatId){
            return;
          }


          // Выбрать предыдущий чат, если он есть
          const previousChat = this.chatDtos[index - 1] || this.chatDtos[0]; // Если предыдущего нет, выбрать первый чат
          if (previousChat && this.selectedChat.chatId === chatId) {
            this.chatSelected.emit(previousChat.chatId);
            this.selectedChat = previousChat;
          } else {
            // this.chatSelected.emit(null);
            this.selectedChat = null;
          }
        
      },
      error: (error) => {
        console.error('Error deleting chat:', error);
      },
    });
  }

  archiveChat(chatId: string): void {
    console.log(`Архивировать чат с ID: ${chatId}`);
    // Логика для архивирования
    this.actionMenuChatId = null;
  }


  // Закрытие меню при клике вне его
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.actionMenuChatId = null;
  }
}
