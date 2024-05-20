import express from 'express' ;
import { createBook,updateBook,listBooks, deleteBook } from './bookController';
import multer from 'multer' ;
import path from 'path';
import authenticate from '../middlewares/authenticate';

const bookRouter = express.Router() ;

//  File store local 
const upload= multer({
    dest: path.resolve(__dirname,'../../public/data/uploads'),
    limits:{fileSize: 1e7},

})

bookRouter.post('/', authenticate, upload.fields([
    {
        name: 'coverImage',
        maxCount:1,
    },
    {
        name: 'file',
        maxCount:1,
    },
]), createBook) ;


bookRouter.post('/:bookId',authenticate,upload.fields([
    {
        name: 'coverImage',
        maxCount:1,
    },
    {
        name:'file',
        maxCount:1,
    },
]),updateBook) ;

bookRouter.get('/',listBooks) ;
bookRouter.delete('/:bookId',authenticate, deleteBook); 

export default bookRouter ; 