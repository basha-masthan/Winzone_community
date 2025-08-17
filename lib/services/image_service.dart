import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cloudinary_public/cloudinary_public.dart';

class ImageService {
  static final ImagePicker _picker = ImagePicker();
  static const String _cloudName = 'drfy6umhn';
  static const String _uploadPreset = 'ml_default'; // You may need to create this in Cloudinary console

  // Pick image from gallery
  static Future<File?> pickImageFromGallery() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      
      if (image != null) {
        return File(image.path);
      }
      return null;
    } catch (e) {
      print('Error picking image from gallery: $e');
      return null;
    }
  }

  // Pick image from camera
  static Future<File?> pickImageFromCamera() async {
    try {
      final XFile? image = await _picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      
      if (image != null) {
        return File(image.path);
      }
      return null;
    } catch (e) {
      print('Error picking image from camera: $e');
      return null;
    }
  }

  // Show image picker dialog
  static Future<File?> showImagePickerDialog(BuildContext context) async {
    return showDialog<File?>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Select Image Source'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library),
                title: const Text('Gallery'),
                onTap: () async {
                  Navigator.of(context).pop();
                  final image = await pickImageFromGallery();
                  Navigator.of(context).pop(image);
                },
              ),
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Camera'),
                onTap: () async {
                  Navigator.of(context).pop();
                  final image = await pickImageFromCamera();
                  Navigator.of(context).pop(image);
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Upload image to Cloudinary
  static Future<String?> uploadImageToCloudinary(File imageFile) async {
    try {
      CloudinaryPublic cloudinary = CloudinaryPublic(_cloudName, _uploadPreset, cache: false);
      
      CloudinaryResponse response = await cloudinary.uploadFile(
        CloudinaryFile.fromFile(
          imageFile.path,
          resourceType: CloudinaryResourceType.Image,
          folder: 'winzone_arena',
        ),
      );

      // Check if upload was successful
      if (response.secureUrl != null && response.secureUrl!.isNotEmpty) {
        return response.secureUrl;
      } else {
        print('Upload failed: No secure URL returned');
        return null;
      }
    } catch (e) {
      print('Error uploading image to Cloudinary: $e');
      return null;
    }
  }

  // Upload multiple images to Cloudinary
  static Future<List<String>> uploadMultipleImagesToCloudinary(List<File> imageFiles) async {
    List<String> uploadedUrls = [];
    
    for (File imageFile in imageFiles) {
      try {
        final url = await uploadImageToCloudinary(imageFile);
        if (url != null) {
          uploadedUrls.add(url);
        }
      } catch (e) {
        print('Error uploading image: $e');
      }
    }
    
    return uploadedUrls;
  }

  // Delete image from Cloudinary
  static Future<bool> deleteImageFromCloudinary(String publicId) async {
    try {
      CloudinaryPublic cloudinary = CloudinaryPublic(_cloudName, _uploadPreset, cache: false);
      
      // Note: Cloudinary public package doesn't support delete operations
      // This is a placeholder for future implementation
      print('Delete operation not supported in public package');
      return true; // Return true as placeholder
    } catch (e) {
      print('Error deleting image from Cloudinary: $e');
      return false;
    }
  }

  // Get image dimensions
  static Future<Size?> getImageDimensions(File imageFile) async {
    try {
      // For now, return null as instantiateImageCodec is not available in web
      // This can be implemented later with proper image package
      print('Image dimensions not available in current implementation');
      return null;
    } catch (e) {
      print('Error getting image dimensions: $e');
      return null;
    }
  }

  // Validate image file
  static bool isValidImageFile(File file) {
    final validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    final fileName = file.path.toLowerCase();
    
    return validExtensions.any((ext) => fileName.endsWith(ext));
  }

  // Get file size in MB
  static double getFileSizeInMB(File file) {
    final bytes = file.lengthSync();
    return bytes / (1024 * 1024);
  }

  // Check if file size is within limit (default: 10MB)
  static bool isFileSizeValid(File file, {double maxSizeMB = 10.0}) {
    return getFileSizeInMB(file) <= maxSizeMB;
  }
}
