import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ServerService } from '../../../services/server.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as go from 'gojs';
import { SidebarComponent } from '../../../components/sidebar/sidebar.component';
import { NavegationComponent } from '../../../components/navegation/navegation.component';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SidebarComponent,
    NavegationComponent,
    RouterModule,
  ], // Asegúrate de agregar estos módulos
  templateUrl: './rooms.component.html',
  styleUrls: ['./rooms.component.css'],
})
export class RoomsComponent implements OnInit {
  roomCode: string = ''; // Código de la sala que obtenemos de la URL
  roomName: string = ''; // Nombre de la sala que obtenemos del backend
  errorMessage: string = ''; // Para manejar errores
  usersInRoom: any[] = []; // Almacena los usuarios que se unen
  //-----------------------------diagramas------------------------------
  @ViewChild('diagramDiv', { static: true }) diagramDiv!: ElementRef;
  public diagram!: go.Diagram;
  attributeName: string = ''; // Nombre del atributo select
  methodName: string = ''; // Nombre del método select
  selectedAttribute: string = ''; //Nombre del atributoDelete select
  selectedMethod: string = ''; //Nombre del metodoDelete select

  methodReturnType: string = 'void'; // Tipo de retorno por defecto para métodos
  attributeReturnType: string = ''; // Tipo de retorno por defecto para atributos

  fromClassId: string | null = null; // Clase de origen
  toClassId: string | null = null; // Clase de destino
  multiplicityFrom: string = ''; // Multiplicidad por defecto origen
  multiplicityTo: string = ''; // Multiplicidad por defecto destino

  classList: any[] = []; // Lista de clases (nodos) disponibles para seleccionar
//------modal
showModal = false; // Control del modal
selectedClass: any = null; // Clase seleccionada
  constructor(
    private route: ActivatedRoute,
    private serverService: ServerService,
    private router: Router,

    private cdr: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    //oyente de nuevo usuario conectado
    this.serverService.joinRoom(this.roomCode);

    this.diagram = new go.Diagram(this.diagramDiv.nativeElement);
    this.initializeDiagram();
  }
  //Inicializar el diagrama
  initializeDiagram() {
    this.diagram.nodeTemplate = go.GraphObject.make(
      go.Node,
      'Auto',
      go.GraphObject.make(go.Shape, 'RoundedRectangle', {
        fill: 'lightblue',
        stroke: 'black',
        strokeWidth: 1,
        portId: '',
      }),
      go.GraphObject.make(
        go.Panel,
        'Vertical',
        { margin: 5 },

        // Nombre de la clase
        go.GraphObject.make(
          go.TextBlock,
          {
            font: 'bold 11pt sans-serif',
            margin: new go.Margin(5, 0, 5, 0),
            editable: true,
          },
          new go.Binding('text', 'name').makeTwoWay()
        ),

        go.GraphObject.make(go.Shape, 'LineH', {
          strokeWidth: 1,
          maxSize: new go.Size(NaN, 10),
        }), // Línea horizontal para separar

        // Panel para atributos
        go.GraphObject.make(
          go.Panel,
          'Vertical',
          new go.Binding('itemArray', 'attributes'),
          {
            itemTemplate: go.GraphObject.make(
              go.Panel,
              'Horizontal',
              go.GraphObject.make(
                go.TextBlock,
                { margin: new go.Margin(5, 0, 5, 0), editable: true },
                new go.Binding('text', 'name').makeTwoWay()
              )
            ),
          }
        ),

        go.GraphObject.make(go.Shape, 'LineH', {
          strokeWidth: 1,
          maxSize: new go.Size(NaN, 10),
        }), // Otra línea horizontal

        // Panel para métodos
        go.GraphObject.make(
          go.Panel,
          'Vertical',
          new go.Binding('itemArray', 'operations'),
          {
            itemTemplate: go.GraphObject.make(
              go.Panel,
              'Horizontal',
              go.GraphObject.make(
                go.TextBlock,
                { margin: new go.Margin(5, 0, 5, 0), editable: true },
                new go.Binding('text', 'name').makeTwoWay()
              )
            ),
          }
        )
      ),
    );

    // Configurar el template de los enlaces
    this.diagram.linkTemplate = new go.Link().add(
      new go.Shape({ stroke: 'black', strokeWidth: 1 }),

      //destino flecha
      new go.Shape()
        .bind('toArrow', 'toArrow')
        //relleno
        .bind('fill', 'fill'),

      //origen
      new go.TextBlock({
        segmentIndex: 0,
        segmentOffset: new go.Point(NaN, NaN),
        editable: true,
        segmentOrientation: go.Orientation.Upright,
      }).bind('text', 'multiplicityFrom'),

      //centro del enlace
      new go.TextBlock({
        segmentIndex: 0,
        segmentFraction: 0.5,
        editable: true,
      }).bind('text', 'text'),

      //destino
      new go.TextBlock({
        segmentIndex: -1,
        segmentOffset: new go.Point(NaN, NaN),
        editable: true,
        segmentOrientation: go.Orientation.Upright,
      }).bind('text', 'multiplicityTo')
    );

    // Inicializar el modelo con algunas clases de prueba
    const initialClasses = [
      {
        key: 1,
        name: 'Clase1',
        attributes: [{ name: 'atributo1' }],
        methods: [{ name: 'metodo1' }],
      },
      { key: 2, name: 'Clase2', attributes: [], methods: [] },
    ];

    // Modelo inicial sin enlaces
    this.diagram.model = new go.GraphLinksModel(initialClasses, []);
    this.classList = initialClasses;

    console.log('Clases disponibles:', this.classList);
  }
  //---------------------------oyente del sidebar------------
  // Método para agregar una clase
  addClass() {
    const newClass = {
      key: this.diagram.model.nodeDataArray.length + 1,
      name: `Clase${this.diagram.model.nodeDataArray.length + 1}`,
      attributes: [],
      methods: [],
    };
    (this.diagram.model as go.GraphLinksModel).addNodeData(newClass);
    this.cdr.detectChanges(); // Refresca la vista
  }
  // menu para agregar atributos, metodos y eliminar la clase

}
