import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('proyectos')
export class Proyect {
  @PrimaryGeneratedColumn()
  proyecto_id: number;

  @Column()
  nombre: string;

  @Column('text')
  descripcion: string;

  @Column()
  estado: boolean;

  @Column()
  responsable: string;

  @Column()
  categoria: string;

  @Column()
  link: string;

  @Column({ type: 'json', nullable: true }) // o 'jsonb' si usas PostgreSQL
  archivos: any[];

  @Column()
  ubicacion: string;
  
  @CreateDateColumn()
  fecha_creacion: Date;
  
  @UpdateDateColumn()
  fecha_actualizacion: Date;

  
  //   @Column('text')
  //   impacto_esperado: string;
}
