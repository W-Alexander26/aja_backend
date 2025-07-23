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

  @Column()
  file: string;

  @Column()
  ubicacion: string;
  
  @CreateDateColumn()
  fecha_creacion: Date;
  
  @UpdateDateColumn()
  fecha_actualizacion: Date;

  
  //   @Column('text')
  //   impacto_esperado: string;
}
