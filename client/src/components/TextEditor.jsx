import React, { useCallback, useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ font: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['bold', 'italic', 'underline'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ align: [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean'],
];
const SAVE_INTERVAL_MS=2000;
const TextEditor = () => {
  const {id:documentID} = useParams()
  const [quill, setQuill] = useState(null); // Use state to manage Quill instance
  const [socket,setSocket]= useState()
  const wrapperRef = useCallback((wrapper) => {
    if (wrapper == null) return;
    wrapper.innerHTML = '';
    const editor = document.createElement('div');
    wrapper.append(editor);
    const newQuill = new Quill(editor, {
      theme: 'snow',
      modules: { toolbar: TOOLBAR_OPTIONS },
    });
    newQuill.disable()
    newQuill.setText('Loading...')
    setQuill(newQuill); // Set the Quill instance using useState
  }, []);

  useEffect(() => {
    const s = io('http://localhost:3001');
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(()=>{
    if(socket==null||quill==null) return
    socket.once('load-document',document=>{
      quill.setContents(document);
      quill.enable()
    })
    socket.emit('get-document',documentID)
  },[socket,quill,documentID])


  useEffect(()=>{
    if(socket==null||quill==null) return

    const interval = setInterval(()=>{
        socket.emit('save-document',quill.getContents())
    },SAVE_INTERVAL_MS)

    return()=>{
      clearInterval(interval)
    }
  },[socket,quill])

  useEffect(()=>{
    if(socket==null|| quill == null) return;

    const handler = (delta)=>{
      quill.updateContents(delta)
    }

    socket.on('receive-changes',handler);

    return ()=>{
      socket.off('receive-changes',handler);
    }
  },[socket,quill])
  useEffect(()=>{
    if(socket==null|| quill == null) return;

    const handler = (delta,oldDelta,sourse)=>{
      if(sourse!='user') return

      socket.emit("send-changes",delta);
    }

    quill.on('text-change',handler);

    return ()=>{
      quill.off('text-change',handler);
    }
  },[socket,quill])
  return (
    <div ref={wrapperRef} className='container'>
      {/* Additional components or UI related to the editor */}
    </div>
  );
};

export default TextEditor;
