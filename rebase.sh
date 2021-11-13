echo "getting origin"

node getorigin.js

echo "exporting"

. exports.sh

echo "removing exports script"

rm exports.sh

echo "setting git user $GIT_USER $GIT_EMAIL"

git config --global user.name $GIT_USER
git config --global user.email $GIT_EMAIL

echo "removing .git"

rm -rf .git

echo "init repo"

git init

echo "adding origin"

git remote add origin $GIT_URL

echo "creating main branch"

git checkout -b main

echo "adding files to commit"

git add .

echo "making initial commit"

git commit -m "Initial commit"

echo "pusing to remote"

git push --set-upstream --force $GIT_PUSH_URL main

echo "done"