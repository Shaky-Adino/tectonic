import { toast, ToastContainer } from "react-toastify";
import NotificationPortal from "../NotificationPortal/NotificationPortal";
import styles from "./toastr.module.css";

export const PostDeleteToastr = () => {
  return (
    <ToastContainer
      position="bottom-center"
      autoClose={3000}
      hideProgressBar={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover={false}>
      {toast.info("Deleted Successfully", {
        className: `${styles.deletePost}`,
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined
      })}
    </ToastContainer>
  );
};

export const Notification = ({newNotification}) => {
  return (
    <ToastContainer
    position="top-right"
    autoClose={5000}
    hideProgressBar
    newestOnTop={true}
    rtl={false}
    pauseOnFocusLoss={false}
    draggable
    pauseOnHover>
      {toast(<NotificationPortal newNotification={newNotification} />, {
        className: `${styles.notification}`,
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      })}
    </ToastContainer>
  );
};