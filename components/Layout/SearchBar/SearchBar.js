import { useEffect, useState } from "react";
import axios from "axios";
import cookie from "js-cookie";
import Router from "next/router";
import Spinner from "../Spinner/Spinner";
import baseUrl from "../../../utils/baseUrl";
import styles from './searchBar.module.css';
let cancel;

export default function SearchBar() {

    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);

    const handleChange = async e => {
        const { value } = e.target;
        setText(value);
    
        if (value.length === 0) return;
        if (value.trim().length === 0) return;

        setLoading(true);
    
        try {
          cancel && cancel();
          const CancelToken = axios.CancelToken;
          const token = cookie.get("token");
    
          const res = await axios.get(`${baseUrl}/api/search/${value}`, {
            headers: { Authorization: token },
            cancelToken: new CancelToken(canceler => {
              cancel = canceler;
            })
          });
    
          if (res.data.length === 0) {
            results.length > 0 && setResults([]);
    
            return setLoading(false);
          }
          setResults(res.data);
        } catch (error) {
          console.log(error);
        }
    
        setLoading(false);
      };
    
      useEffect(() => {
        if (text.length === 0 && loading) setLoading(false);
      }, [text]);

    return (
      <>
        <div className={styles.searchbar}>
            <div className={styles.searchIcon}>
              <i className="fas fa-search" />
            </div>
            <input
              onBlur={()=>{
                  results.length > 0 && setResults([]);
                  loading && setLoading(false);
                  setText("");
              }}
              value={text}
              onChange={handleChange}
              placeholder="Search for friends"
              className={styles.searchInput}
            />
            {loading && <Spinner className={styles.userLoading}/>}
        </div>
        <div className={styles.searchResult}>
          {results.map((data) => (
            <div key={data._id} className={styles.searchItem} onClick={()=>Router.push(`/${data.username}`)}>
              <div>
                <img
                  src={data.profilePicUrl}
                  alt=""
                />
              </div>
              <h4>{data.name}</h4>
            </div>
          ))}
          {(text && results.length === 0) &&
            <div className={`${styles.searchItem} ${styles.noResults}`}>
              <h4>No results found</h4>
            </div>
          }
        </div>
      </>
    );
}