import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Importa FormsModule para habilitar ngModel
import { ApiService } from '../../../services/api.service';
import { ServerService } from '../../../services/server.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  providers: [ApiService], // Añadir FormsModule aquí
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
})
export class WelcomeComponent {
  joinErrorMessage: string = '';
  roomName: string = ''; // Para la creación de sala
  roomCode: string = ''; // Código para unirse a la sala
  errorMessage: string = ''; // Para manejar mensajes de error
  constructor(
    private apiService: ApiService,
    private router: Router,
    private serverService: ServerService
  ) {}

  logout() {
    this.apiService.logout(); // Cerrar sesión
  }

  // Método para crear una sala y conectarse a través de sockets
  createRoom() {
    const createRoomDto = { name: this.roomName };

    this.apiService.createRoom(createRoomDto).subscribe({
      next: (room) => {
        this.serverService.createRoom(createRoomDto); // Emite el evento de creación de sala vía socket
        this.router.navigate([`/room/${room.code}`]); // Redirige a la sala
      },
      error: (err) => {
        console.error('Error al crear la sala:', err);
        this.errorMessage = 'No se pudo crear la sala. Inténtalo de nuevo.';
      },
    });
  }
  // Unirse a una sala
  joinRoom() {
    if (!this.roomCode) {
      this.joinErrorMessage = 'Por favor, ingresa un código de sala';
      return;
    }

    this.apiService.joinRoom(this.roomCode).subscribe({
      next: (response) => {
        console.log('Respuesta del servidor:', response);
        this.router.navigate([`/room/${this.roomCode}`]);  // Redirige a la sala
      },
      error: (err) => {
        console.error('Error al unirse a la sala:', err);
        this.joinErrorMessage = 'No se pudo unir a la sala. Verifica el código e inténtalo de nuevo.';
      }
    });
  }
  /* joinRoom() {
    this.serverService.joinRoom(this.roomCode); // Solo navega al room, sin suscripción
    this.router.navigate([`/room/${this.roomCode}`]); // Redirige a la sala
  } */
}
