http://localhost:2323/api/proyectos/archivo - POST

El archivo se sube con postman.
1-Se tiene que pasar el archivo por medio del ' body -> form-data '

    ________________________________
    | Key   | Value                |
    | form  | [arhivo-elegido.jpg] |
    |       |                      |


http://localhost:2323/api/proyectos - POST

Json:

    {
        "nombre": "Wanpatan",
        "descripcion": "Proyecto de abogado independiente",
        "estado": true,
        "responsable": "Charlie",
        "categoria": "Pagina Web",
        "link": "https://www.licenciadocarlosvargas.com/",
        "ubicacion": "Puntarenas",
        "archivos": [] //Dentro de COMILLAS cada link
    }
