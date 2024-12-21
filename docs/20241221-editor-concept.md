# Editor concept

Code editor content is html (with markdown) , representing chat thread

````md
<user>
Hello! write a poem
</user>
<assistant>
Hi, here is your poem:
```txt
Once upon a time
````

</assistant>
```

User can select, convert and edit content. Editor will create a reference to the separate artifact.

```md
<user>
Hello! write a poem
</user>
<assistant>
Hi, here is your poem:
<artifact href="sandbox://poem.txt" mime-type="text/plain"/>
</assistant>
```

During human edit: we directly digest edits in the Editor
During AI generation/edit:

- Naively, we place the cursor to where AI can edit and let AI take over (single thread)
- OR, We spawn additional cursors, or CRDT editors for AI to take full control
- OR, use an underlying DOM document as CRDT, and map DOM mutations back to the editor
