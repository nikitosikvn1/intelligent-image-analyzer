import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

/**
 * The User entity represents the user data model within the database, utilizing TypeORM decorators
 * to define the table structure in a SQL database. This entity is mapped to the 'users' table,
 * with columns for the user's ID, first name, last name, email, and password, facilitating
 * authentication and personal identification within the application.
 * 
 * @Entity Decorator that marks the class as a TypeORM entity and maps it to the 'users' table.
 */
@Entity({ name: 'users' })
export class User {
  /**
   * The primary key of the User table, auto-generated for new entries.
   * 
   * @PrimaryGeneratedColumn Decorator that designates this column as the primary key and indicates that its value will be auto-generated upon insertion.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The user's first name, stored as a variable character string with a maximum length of 255 characters.
   * 
   * @Column Decorator that maps this property to a varchar column in the 'users' table, specifying the column type and maximum length.
   */
  @Column({ type: 'varchar', length: 255 })
  firstname: string;

  /**
   * The user's last name, stored as a variable character string with a maximum length of 255 characters.
   * 
   * @Column Decorator that maps this property to a varchar column in the 'users' table,
   * specifying the column type and maximum length.
   */
  @Column({ type: 'varchar', length: 255 })
  lastname: string;

  /**
   * The user's email address, marked as unique within the database to prevent duplicate entries.
   * 
   * @Column Decorator that maps this property to a column in the 'users' table, enforcing uniqueness to ensure no two users can register with the same email address.
   */
  @Column({ unique: true })
  email: string;

  /**
   * The user's password, stored as a hashed string for security.
   * 
   * @Column Short for mapping the hashed password storage column.
   */
  @Column()
  password: string;
}
