import { useEffect, useRef, useState } from "react";
import { deletePost } from "../../../../utils/postActions";
import styles from "./deletePost.module.css";

export default function DeletePost({id, setPosts, setShowToastr}) {
  const ref = useRef();
  const [deletePostConfirmation, setDeletePostConfirmation] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setDeletePostConfirmation(false);
      }
    }

    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  const delPost = ()=>{
    // deletePost(id, setPosts, setShowToastr);
    setShowToastr(true);
  }

  return (
    <i
      ref={ref}
      className={`${styles.deletePost} fas fa-trash`}
      onClick={() => setDeletePostConfirmation(true)}
    >
      {deletePostConfirmation && (
        <div className={styles.confirmDelete}>
          <p>Are you sure?</p>
          <p className={styles.finalDelete} onClick={delPost}>
            <i className="fas fa-trash" />
            &nbsp;Delete
          </p>
        </div>
      )}
    </i>
  );
}