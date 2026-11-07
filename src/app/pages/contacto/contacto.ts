import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './contacto.html',
  styleUrls: ['./contacto.css'],
})
export class ContactoComponent {
  readonly cine = {
    nombre: 'Cine Marcenter',
    direccion: 'Av. Colón 3450, Mar del Plata',
    telefono: '(0223) 499-1200',
    email: 'cines@cinespaseoaldrey.com.ar',
    horarios: 'Todos los días de 12:00 a 00:30 hs',
    redes: '@cinemarcenter',
  };
}
