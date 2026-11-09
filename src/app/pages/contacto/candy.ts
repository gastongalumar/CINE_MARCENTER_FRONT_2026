import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-candy',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './candy.html',
  styleUrls: ['./cumpleanos.css'],
})
export class CandyComponent {
  readonly combos = [
    {
      icon: 'local_drink',
      titulo: 'Combo Clásico',
      detalle: 'Balde mediano de pochoclos + gaseosa mediana',
      precio: '$4.500',
      nota: 'Ideal para una persona. Elegí el sabor de la gaseosa en candy bar.',
    },
    {
      icon: 'fastfood',
      titulo: 'Combo Marcenter',
      detalle: 'Balde grande de pochoclos + gaseosa grande + golosinas',
      precio: '$6.900',
      nota: 'El más pedido. Incluye una caja de chocolates o gomitas a elección.',
    },
    {
      icon: 'groups',
      titulo: 'Combo Duo',
      detalle: '2 baldes medianos + 2 gaseosas medianas + 1 golosina compartida',
      precio: '$8.200',
      nota: 'Pensado para dos. Perfecto para compartir sin pelearse el balde.',
    },
    {
      icon: 'celebration',
      titulo: 'Combo Familiar',
      detalle: 'Balde XL + 3 gaseosas medianas + 2 golosinas',
      precio: '$11.500',
      nota: 'Para 3 o 4 personas. Pedilo en candy bar planta baja antes de la función.',
    },
    {
      icon: 'star',
      titulo: 'Combo Nachos Picantes',
      detalle: 'Bandeja de nachos con queso cheddar + gaseosa mediana',
      precio: '$5.200',
      nota: 'Opción salada. Consultá disponibilidad: se prepara al momento.',
    },
    {
      icon: 'icecream',
      titulo: 'Combo Dulce',
      detalle: 'Pochoclos caramelizados + gaseosa mediana + chocolate',
      precio: '$5.800',
      nota: 'Edición Candy Bar Marcenter. Stock limitado los fines de semana.',
    },
  ];
}
