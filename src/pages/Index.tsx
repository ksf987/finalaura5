import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { generateAuraDates } from '../utils/auraCalculation';
import DatePicker from '../components/DatePicker';
import TaskItem from '../components/TaskItem';
import { Plus, FolderPlus, Layout, Folder, CheckSquare, ArrowDown, Trash2, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from '../hooks/use-toast';

const Index = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFolderInput, setShowFolderInput] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [lastEndDate, setLastEndDate] = useState(null);
  const [todaysTasks, setTodaysTasks] = useState([]);

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'), orderBy('serialNumber'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const tasksData = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksData);
      
      if (tasksData.length > 0) {
        setLastEndDate(new Date(tasksData[tasksData.length - 1].endDate));
      }

      // Update today's tasks
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysTasks = tasksData.filter(task => {
        const taskDate = new Date(task.currentDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
      setTodaysTasks(todaysTasks);
    });

    const foldersQuery = query(collection(db, 'folders'), orderBy('createdAt'));
    const unsubscribeFolders = onSnapshot(foldersQuery, (querySnapshot) => {
      const foldersData = [];
      querySnapshot.forEach((doc) => {
        foldersData.push({ id: doc.id, ...doc.data() });
      });
      setFolders(foldersData);
    });

    return () => {
      unsubscribeTasks();
      unsubscribeFolders();
    };
  }, []);

  const updateTaskSerialNumbers = async () => {
    const batch = writeBatch(db);
    const tasksQuery = query(collection(db, 'tasks'), orderBy('serialNumber'));
    const snapshot = await tasksQuery.get();
    
    snapshot.docs.forEach((doc, index) => {
      const newSerialNumber = index + 1;
      batch.update(doc.ref, { serialNumber: newSerialNumber });
    });

    await batch.commit();
  };

  const handleAddTask = () => setShowDatePicker(true);
  const handleAddFolder = () => setShowFolderInput(true);

  const handleFolderSave = async (e) => {
    e.preventDefault();
    if (folderName.trim()) {
      try {
        if (editingFolder) {
          const folderRef = doc(db, 'folders', editingFolder.id);
          await updateDoc(folderRef, {
            name: folderName.trim()
          });
        } else {
          await addDoc(collection(db, 'folders'), {
            name: folderName.trim(),
            createdAt: new Date().toISOString()
          });
        }
        setFolderName('');
        setShowFolderInput(false);
        setEditingFolder(null);
      } catch (error) {
        console.error('Error saving folder:', error);
        toast({
          title: "Error",
          description: "Failed to save folder. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeleteFolder = async (folderId, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this folder?')) {
      try {
        await deleteDoc(doc(db, 'folders', folderId));
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  const handleDateSelect = async (endDate) => {
    try {
      const today = new Date();
      const auraDates = generateAuraDates(today, endDate);
      const serialNumber = tasks.length + 1;

      await addDoc(collection(db, 'tasks'), {
        serialNumber,
        endDate: endDate.toISOString(),
        currentDate: auraDates[1]?.toISOString() || today.toISOString(),
        currentAuraIndex: 0,
        text1: '',
        image1: null,
        image2: null,
        createdAt: new Date().toISOString()
      });

      setShowDatePicker(false);
      setLastEndDate(endDate);
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleTaskUpdate = async () => {
    await updateTaskSerialNumbers();
    setTasks(prev => [...prev]);
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    });
  };

  const handleEditFolder = (folder, e) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderName(folder.name);
    setShowFolderInput(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Task Manager
              </h1>
              <p className="text-slate-400 text-lg">
                Organize your work with professional task management
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddTask}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 px-6"
                size="lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Task
              </Button>
              <Button
                onClick={handleAddFolder}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white h-12 px-6 transition-all duration-300"
                size="lg"
              >
                <FolderPlus className="w-5 h-5 mr-2" />
                New Folder
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <CheckSquare className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Active Tasks</p>
                  <p className="text-2xl font-bold text-white">{tasks.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Folder className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Folders</p>
                  <p className="text-2xl font-bold text-white">{folders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Layout className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Items</p>
                  <p className="text-2xl font-bold text-white">{tasks.length + folders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Calendar className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Today's Tasks</p>
                  <div className="text-sm text-amber-300 mt-1">
                    {todaysTasks.length > 0 ? (
                      todaysTasks.map(task => `#${task.serialNumber}`).join(', ')
                    ) : (
                      <span className="text-slate-400">No tasks for today</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Tasks Section */}
          {tasks.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-semibold text-white">Active Tasks</h2>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    {tasks.length} items
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {tasks.map((task) => (
                  <TaskItem 
                    key={task.id} 
                    task={task} 
                    collectionName="tasks"
                    onUpdate={handleTaskUpdate}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Folders Section */}
          {folders.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-semibold text-white">Project Folders</h2>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {folders.length} folders
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {folders.map((folder) => (
                  <Card 
                    key={folder.id}
                    className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-300 cursor-pointer group hover:shadow-xl hover:shadow-purple-500/10 backdrop-blur-sm"
                    onClick={() => navigate(`/folder/${folder.id}`)}
                  >
                    <CardContent className="p-6 relative">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                          <Folder className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                            {folder.name}
                          </h3>
                          <p className="text-slate-400 text-sm">Click to open</p>
                        </div>
                      </div>
                      
                      <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={(e) => handleEditFolder(folder, e)}
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </Button>
                        <Button
                          onClick={(e) => handleDeleteFolder(folder.id, e)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {tasks.length === 0 && folders.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layout className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Get Started</h3>
                <p className="text-slate-400 mb-6">Create your first task or folder to begin organizing your work</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleAddTask} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Task
                  </Button>
                  <Button onClick={handleAddFolder} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Scroll to Bottom Button */}
        <Button
          onClick={scrollToBottom}
          className="fixed bottom-8 right-8 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 w-12 h-12 flex items-center justify-center"
          size="icon"
        >
          <ArrowDown className="w-5 h-5" />
        </Button>

        {/* Modals */}
        {showDatePicker && (
          <DatePicker
            onDateSelect={handleDateSelect}
            onCancel={() => setShowDatePicker(false)}
            defaultDate={lastEndDate}
          />
        )}

        {showFolderInput && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-white">
                  {editingFolder ? 'Edit Folder' : 'Create New Folder'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleFolderSave}>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Enter folder name..."
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    autoFocus
                  />
                  <div className="flex justify-end gap-3 mt-4">
                    <Button
                      type="button"
                      onClick={() => {
                        setShowFolderInput(false);
                        setEditingFolder(null);
                        setFolderName('');
                      }}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {editingFolder ? 'Save Changes' : 'Create Folder'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;