import { NextFunction, Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import path from "path";
import createHttpError from "http-errors";
import bookModel from "./bookModel";
import fs from 'fs' ;

export const createBook = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

   const {title,genre} = req.body ;

  console.log(req.files);
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

    console.log("bookFileUploadResult: ", bookFileUploadResult);
    console.log("uplodaresult : ", uploadResult);

    // @ts-ignore
    console.log('userId ,', req.userId) ; 


    const newBook = await bookModel.create({
        title,
        genre,
        author:'664b50f6a6488795c16b2050',
        coverImage:uploadResult.secure_url,
        file:bookFileUploadResult.secure_url,
    }) ;

    // Delete temp files
    try{
        await fs.promises.unlink(bookFilePath) ; 
        await fs.promises.unlink(filePath) ; 
    }catch(err){
        console.log(err) ;
        return next(createHttpError(500, 'Error while deleting temporary files!')) ;
    }

    return res.status(201).json({id: newBook._id}) ;
    
  } catch (err) {
    console.log(err) ;
    return next(createHttpError(500, 'Error while uploading the files.')) ;
  }

} ;
