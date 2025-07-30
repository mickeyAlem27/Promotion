import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiImage, FiVideo, FiX, FiSend } from 'react-icons/fi';

const CreatePost = () => {
  const navigate = useNavigate();
  const [postText, setPostText] = useState('');
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleMediaUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    if (fileType !== 'image' && fileType !== 'video') {
      alert('Please upload an image or video file');
      return;
    }

    setMediaType(fileType);
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaPreview(null);
    setMediaType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postText.trim() && !mediaPreview) {
      alert('Please add some text or media to your post');
      return;
    }

    setIsSubmitting(true);
    try {
      // Here you would typically upload the media to a server
      // and then create a post with the returned URL
      console.log('Creating post with:', { postText, mediaType });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      setPostText('');
      setMediaPreview(null);
      setMediaType(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Navigate back to home or show success message
      navigate('/home');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Create Post</h1>
          <button 
            onClick={() => navigate('/home')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <textarea
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full bg-transparent border-none outline-none resize-none text-gray-200 placeholder-gray-500 min-h-[100px]"
            />

            {mediaPreview && (
              <div className="mt-4 relative group">
                {mediaType === 'image' ? (
                  <img 
                    src={mediaPreview} 
                    alt="Preview" 
                    className="w-full rounded-lg max-h-96 object-cover"
                  />
                ) : (
                  <video 
                    src={mediaPreview} 
                    controls 
                    className="w-full rounded-lg max-h-96"
                  />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-black/70 rounded-full p-2 hover:bg-black/90 transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <label className="p-2 rounded-full hover:bg-gray-800 cursor-pointer transition-colors">
                <FiImage size={24} className="text-green-500" />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
              <label className="p-2 rounded-full hover:bg-gray-800 cursor-pointer transition-colors">
                <FiVideo size={24} className="text-blue-500" />
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleMediaUpload}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!postText.trim() && !mediaPreview)}
              className={`px-6 py-2 rounded-full font-medium flex items-center space-x-2 ${
                (isSubmitting || (!postText.trim() && !mediaPreview))
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90'
              }`}
            >
              {isSubmitting ? 'Posting...' : 'Post'}
              <FiSend className="ml-2" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;