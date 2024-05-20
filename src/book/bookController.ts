import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from "fs";

export interface AuthRequest extends Request {
  userId: string;
}

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, genre } = req.body;

  // console.log(req.files);
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);

  const fileName = files.coverImage[0].filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      filename_override: fileName,
      folder: "book-covers",
      format: coverImageMimeType,
    });

    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );
    const bookFileUploadResult = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: bookFileName,
        folder: "book-pdfs",
        format: "pdf",
      }
    );

    const _req = req as AuthRequest;

    const newBook = await bookModel.create({
      title,
      genre,
      author: _req.userId,
      coverImage: uploadResult.secure_url,
      file: bookFileUploadResult.secure_url,
    });

    // Delete temp files
    try {
      await fs.promises.unlink(bookFilePath);
      await fs.promises.unlink(filePath);
    } catch (err) {
      console.log(err);
      return next(
        createHttpError(500, "Error while deleting temporary files!")
      );
    }

    return res.status(201).json({ id: newBook._id });
  } catch (err) {
    console.log(err);
    return next(createHttpError(500, "Error while uploading the files."));
  }
};

export const updateBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { title, genre } = req.body;
  const bookId = req.params.bookId;
  const book = await bookModel.findOne({ _id: bookId });
  if (!book) {
    return next(createHttpError(404, "Book not found!"));
  }

  const _req = req as AuthRequest;

  if (book.author.toString() !== _req.userId) {
    return next(createHttpError(403, 'You cannot update other"s book'));
  }

  // check if image field exists ?
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  try{
    let completeCoverImage = "";
  if (files.coverImage) {
    const fileName = files.coverImage[0].filename;
    const filePath = path.resolve(
      __dirname,
      "../../public/data/uploads" , fileName
    );
    completeCoverImage= fileName; 
    const coverImageMimeType = files.coverImage[0].mimetype.split("/").at(-1);
    const uploadResult=await cloudinary.uploader.upload(filePath,{
      filename_override:completeCoverImage,
      folder:'book-covers',
      format:coverImageMimeType, 
    }); 
    completeCoverImage=uploadResult.secure_url; 
    await fs.promises.unlink(filePath) ;
  }

  // check if file field exists
  let completeFileName="" ;
  if(files.file){
    const bookFileName = files.file[0].filename;
    const bookFilePath = path.resolve(
      __dirname,
      "../../public/data/uploads",
      bookFileName
    );
    completeFileName=bookFileName;

    const uploadResultPdf = await cloudinary.uploader.upload(
      bookFilePath,
      {
        resource_type: "raw",
        filename_override: completeFileName,
        folder: "book-pdfs",
        format:'pdf',
      }
    );
    completeFileName=uploadResultPdf.secure_url; 
    await fs.promises.unlink(bookFilePath); 
  }
  const updatedBook = await bookModel.findByIdAndUpdate({
    _id:bookId
  },
{
  title,
  genre,
  coverImage: completeCoverImage ? completeCoverImage : book.coverImage,
  file: completeFileName ? completeFileName : book.file,
},{
  new:true
}) ;
  return res.json(updatedBook) ;
  }catch(err){
    return next(createHttpError(404, 'Error while updating book info!')) ;
  }
  

};

export const listBooks=async(
  req: Request,
  res: Response,
  next: NextFunction
)=>{
   try{ 
    const book= await bookModel.find() ; 
    return res.json(book) ;

   }catch(err){ 
    return next(createHttpError(500,'Error while geting a book')) ;
   }
}

export const deleteBook= async(
  req: Request,
  res: Response,
  next: NextFunction
)=>{
  const bookId= req.params.bookId ;
  const book= await bookModel.findOne({_id:bookId}) ;
  if(!book){
    return next(createHttpError(404,'Book not found!')) ;
  }
  const _req=req as AuthRequest
  if(book.author.toString() !== _req.userId){
    return next(createHttpError(404,'You can only delete your own book!')); 
  }
  const coverFileSplits = book.coverImage.split("/") ;
  const coverImagePublicId = coverFileSplits.at(-2) + '/' + (coverFileSplits.at(-1)?.split('.').at(-2)) ;

  const bookFileSplits = book.file.split('/') ;
  const bookFilePublicId= bookFileSplits.at(-2)+'/'+bookFileSplits.at(-1) ;

  try{
    await cloudinary.uploader.destroy(coverImagePublicId);
    await cloudinary.uploader.destroy(bookFilePublicId,{
      resource_type:'raw',
    });
  }catch(err){
    return next(createHttpError(404,'Error while deleting book pdf!')) ; 
  }
  await book.deleteOne({_id:bookId}) ;
  return res.sendStatus(204) ;

}