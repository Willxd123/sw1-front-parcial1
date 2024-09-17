import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Socket } from 'ngx-socket-io';
import { CustomSocket } from '../../../services/custom-socket.service';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [],
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
})
export class RoomsComponent implements OnInit {
  roomCode: string = '';  // Código de la sala que obtenemos de la URL
  roomName: string = '';  // Nombre de la sala que obtenemos del backend
  errorMessage: string = '';  // Para manejar errores

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit(): void {
    // Obtener el código de la sala desde la URL
    this.roomCode = this.route.snapshot.paramMap.get('code') || '';

    // Llamar al servicio para obtener el nombre de la sala
    this.getRoomDetails(this.roomCode);
  }

  // Método para obtener los detalles de la sala
  getRoomDetails(roomCode: string) {
    this.apiService.getRoomDetails(roomCode).subscribe({
      next: (room) => {
        this.roomName = room.name;  // Asigna el nombre de la sala
      },
      error: (err) => {
        console.error('Error al obtener los detalles de la sala:', err);
        this.errorMessage = 'No se pudo cargar la sala. Inténtalo de nuevo.';
      }
    });
  }
}
