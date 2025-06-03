
import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateAuraDates, formatDate } from '../utils/auraCalculation';
import TextPopup from './TextPopup';
import ImageUpload from './ImageUpload';
import ConfirmDialog from './ConfirmDialog';
import { Eye, Check, X, Image, MessageSquare, Calendar, EyeOff } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const TaskItem = ({ task, collectionName, onUpdate }) => {
  const [showTextPopup, setShowTextPopup] = useState(false);
  const [showText2Popup, setShowText2Popup] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [editingText, setEditingText] = useState(false);
  const [editingText2, setEditingText2] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [text2Input, setText2Input] = useState('');
  const [showTextInput, setShowTextInput] = useState(!task.text1);
  const [showText2Input, setShowText2Input] = useState(false);
  const [showText2, setShowText2] = useState(false);

  const truncateText = (text, maxLength = 30) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const handleSaveText = async () => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      await updateDoc(taskRef, { text1: textInput });
      setShowTextInput(false);
      setTextInput('');
      onUpdate();
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  const handleSaveText2 = async () => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      await updateDoc(taskRef, { text2: text2Input });
      setShowText2Input(false);
      setText2Input('');
      onUpdate();
    } catch (error) {
      console.error('Error saving text2:', error);
    }
  };

  const handleTextEdit = async (newText) => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      await updateDoc(taskRef, { text1: newText });
      onUpdate();
    } catch (error) {
      console.error('Error updating text:', error);
    }
  };

  const handleText2Edit = async (newText) => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      await updateDoc(taskRef, { text2: newText });
      onUpdate();
    } catch (error) {
      console.error('Error updating text2:', error);
    }
  };

  const handleImageUpdate = async (imageKey, imageData) => {
    try {
      const taskRef = doc(db, collectionName, task.id);
      await updateDoc(taskRef, { [imageKey]: imageData });
      onUpdate();
    } catch (error) {
      console.error('Error updating image:', error);
    }
  };

  const handleNotDone = async () => {
    try {
      const auraDates = generateAuraDates(new Date(), new Date(task.endDate));
      const currentIndex = task.currentAuraIndex || 0;
      const newIndex = Math.min(currentIndex + 1, auraDates.length - 1);
      
      const taskRef = doc(db, collectionName, task.id);
      await updateDoc(taskRef, { 
        currentAuraIndex: newIndex,
        currentDate: auraDates[newIndex].toISOString()
      });
      onUpdate();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDone = async () => {
    try {
      await deleteDoc(doc(db, collectionName, task.id));
      onUpdate();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getCurrentDate = () => {
    const auraDates = generateAuraDates(new Date(), new Date(task.endDate));
    const currentIndex = task.currentAuraIndex || 0;
    return auraDates[Math.min(currentIndex + 1, auraDates.length - 1)];
  };

  return (
    <Card className="bg-slate-800/60 border-slate-700 hover:bg-slate-800/80 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/10">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">{task.serialNumber}</span>
            </div>
            <div>
              <h3 className="text-white font-medium">Task #{task.serialNumber}</h3>
              <div className="flex items-center text-slate-400 text-sm mt-1">
                <Calendar className="w-3 h-3 mr-1" />
                Next: {formatDate(getCurrentDate())}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => setShowConfirm('notDone')}
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setShowConfirm('done')}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Check className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Primary Text */}
          {showTextInput ? (
            <div className="space-y-3">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter task description..."
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-none min-h-[100px]"
              />
              <div className="flex justify-end">
                <Button 
  onClick={handleSaveText} 
  size="sm" 
  className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-700"
>
  Save Description
</Button>

              </div>
            </div>
          ) : (
            <div
              onClick={() => setShowTextPopup(true)}
              className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-4 cursor-pointer transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                <div className="flex-1">
                  <p className="text-slate-300 group-hover:text-white transition-colors">
                    {task.text1 ? truncateText(task.text1) : 'Click to add description...'}
                  </p>
                  {task.text1 && (
                    <p className="text-slate-500 text-xs mt-1">Click to view full text</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Secondary Text (for folder items) */}
          {collectionName.includes('folder') && (
            <>
              {showText2Input ? (
                <div className="space-y-3">
                  <textarea
                    value={text2Input}
                    onChange={(e) => setText2Input(e.target.value)}
                    placeholder="Enter additional notes..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none min-h-[100px]"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleSaveText2} size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Save Notes
                    </Button>
                  </div>
                </div>
              ) : showText2 && task.text2 ? (
                <div
                  onClick={() => setShowText2Popup(true)}
                  className="bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-4 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
                    <div className="flex-1">
                      <p className="text-slate-300 group-hover:text-white transition-colors">
                        {truncateText(task.text2)}
                      </p>
                      <p className="text-slate-500 text-xs mt-1">Additional notes</p>
                    </div>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => {
                    if (!showText2) {
                      setShowText2(true);
                      if (!task.text2) {
                        setShowText2Input(true);
                      }
                    } else {
                      setShowText2(false);
                      setShowText2Input(false);
                    }
                  }}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white border-dashed"
                >
                  {showText2 ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {showText2 ? 'Hide Additional Notes' : 'Show Additional Notes'}
                </Button>
              )}
            </>
          )}

          {/* Images Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Image className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm font-medium">Attachments</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ImageUpload
                label={
                  <div className="flex items-center justify-center space-x-2 text-slate-400">
                    <Image className="w-5 h-5" />
                    <span>Image 1</span>
                  </div>
                }
                image={task.image1}
                onImageChange={(imageData) => handleImageUpdate('image1', imageData)}
              />
              <ImageUpload
                label={
                  <div className="flex items-center justify-center space-x-2 text-slate-400">
                    <Image className="w-5 h-5" />
                    <span>Image 2</span>
                  </div>
                }
                image={task.image2}
                onImageChange={(imageData) => handleImageUpdate('image2', imageData)}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        {showTextPopup && (
          <TextPopup
            text={task.text1}
            onClose={() => setShowTextPopup(false)}
            onSave={handleTextEdit}
            isEditing={editingText}
          />
        )}

        {showText2Popup && (
          <TextPopup
            text={task.text2}
            onClose={() => setShowText2Popup(false)}
            onSave={handleText2Edit}
            isEditing={editingText2}
          />
        )}

        {showConfirm && (
          <ConfirmDialog
            message={showConfirm === 'done' ? 'Mark this task as completed?' : 'Move this task to next phase?'}
            onConfirm={() => {
              if (showConfirm === 'done') {
                handleDone();
              } else {
                handleNotDone();
              }
              setShowConfirm(null);
            }}
            onCancel={() => setShowConfirm(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TaskItem;
