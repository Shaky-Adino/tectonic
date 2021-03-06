import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import styles from "./profile.module.css";

export default function ProfilePic({ setMedia,userImage }) {

  const [mediaPreview, setMediaPreview] = useState(userImage || null);
  const [highlighted, setHighlighted] = useState(false);
  
  const inputRef = useRef();

  const handleChange = e => {
    const {files} = e.target;
    if(!files || files.length < 1)
        return;
    setMedia(files[0]);
    setMediaPreview(URL.createObjectURL(files[0]));
  };

  return (
    <div 
    onDragOver={e=>{
        e.preventDefault();
        setHighlighted(true);
    }}
    onDragLeave={e=>{
        e.preventDefault();
        setHighlighted(false);
    }}
    onDrop={e=>{
        e.preventDefault();
        setHighlighted(false);
        const droppedFile = Array.from(e.dataTransfer.files);
        setMedia(droppedFile[0]);
        setMediaPreview(URL.createObjectURL(droppedFile[0]));
    }}
    className={highlighted ? `${styles.profilePic} ${styles.highlighted}` : styles.profilePic}>
      <input
        style={{ display: "none" }}
        type="file"
        accept="image/"
        onChange={handleChange}
        name="media"
        ref={inputRef}
      />
      <FontAwesomeIcon icon={faCamera} className={styles.item} onClick={()=>inputRef.current.click()} />
      {mediaPreview && <img src={mediaPreview} width="100%" height="100%" onClick={()=>inputRef.current.click()}/>}
    </div>
  );
}
